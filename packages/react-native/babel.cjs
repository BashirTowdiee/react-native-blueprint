const path = require('node:path');
const hosts = new Set(['View', 'Text', 'Pressable', 'ScrollView', 'TextInput', 'Image', 'ActivityIndicator', 'TouchableOpacity', 'TouchableHighlight', 'TouchableWithoutFeedback', 'SafeAreaView', 'Switch', 'FlatList', 'SectionList']);

function ownerName(elementPath) {
  for (let scope = elementPath.scope; scope; scope = scope.parent) {
    const p = scope.path;
    let name = p.isFunction() ? p.node.id?.name : undefined;
    let parent = p.parentPath;
    for (let depth = 0; !name && parent && depth < 8; depth++, parent = parent.parentPath) {
      if (parent.isVariableDeclarator()) { name = parent.node.id.name; break; }
      if (!parent.isCallExpression() && !parent.isTSAsExpression() && !parent.isTSTypeAssertion()) break;
    }
    if (name && /^[A-Z]/.test(name)) return name;
  }
  return 'Anonymous';
}
function sourceFile(state) {
  const root = path.resolve(state.opts.root || process.cwd());
  const relative = state.filename && path.relative(root, state.filename);
  if (state.opts.enabled === false || state.file.opts.envName === 'production' || !relative || relative.startsWith('..') || path.isAbsolute(relative) || relative.split(path.sep).includes('node_modules')) return;
  const file = relative.split(path.sep).join('/');
  return !state.opts.include || state.opts.include.some(prefix => file.startsWith(prefix)) ? file : undefined;
}

// Build-time instrumentation: preserves host layout, keys, refs and original props.
module.exports = ({ types: t }) => ({
  name: 'blueprint-source',
  visitor: {
    Program: {
      enter(program, state) {
        state.blueprintImport = program.scope.generateUidIdentifier('BlueprintSourceElement');
        state.blueprintUsed = false;
        state.blueprintUsageImport = program.scope.generateUidIdentifier('withBlueprintSourceUsage');
        state.blueprintUsageUsed = false;
        state.blueprintUsageNodes = new WeakSet();
      },
      exit(program, state) {
        const imports = [];
        if (state.blueprintUsed) imports.push(t.importSpecifier(state.blueprintImport, t.identifier('BlueprintSourceElement')));
        if (state.blueprintUsageUsed) imports.push(t.importSpecifier(state.blueprintUsageImport, t.identifier('withBlueprintSourceUsage')));
        if (imports.length) program.unshiftContainer('body', t.importDeclaration(imports, t.stringLiteral('@react-native-blueprint/react-native')));
      },
    },
    JSXOpeningElement(elementPath, state) {
      const { node } = elementPath;
      const filename = state.filename;
      const root = path.resolve(state.opts.root || process.cwd());
      const relative = filename && path.relative(root, filename);
      if (state.opts.enabled === false || state.file.opts.envName === 'production' || !relative || relative.startsWith('..') || path.isAbsolute(relative) || relative.split(path.sep).includes('node_modules') || !node.loc || !t.isJSXIdentifier(node.name)) return;
      if (state.opts.include && !state.opts.include.some((prefix) => relative.split(path.sep).join('/').startsWith(prefix))) return;
      const binding = elementPath.scope.getBinding(node.name.name);
      if (!binding?.path.isImportSpecifier()) return;
      const imported = binding.path.node.imported.name;
      const library = binding.path.parent.source.value;
      const location = t.objectExpression([
        t.objectProperty(t.identifier('file'), t.stringLiteral(relative.split(path.sep).join('/'))),
        t.objectProperty(t.identifier('line'), t.numericLiteral(node.loc.start.line)),
        t.objectProperty(t.identifier('column'), t.numericLiteral(node.loc.start.column + 1)),
      ]);
      if (library === '@react-native-blueprint/react-native' && imported === 'BlueprintInspectable') {
        if (!node.attributes.some((a) => t.isJSXAttribute(a) && a.name.name === 'sourceLocation')) node.attributes.push(t.jsxAttribute(t.jsxIdentifier('sourceLocation'), t.jsxExpressionContainer(location)));
        return;
      }
      if (library !== 'react-native' || !hosts.has(imported)) return;
      const owner = ownerName(elementPath);
      const original = t.identifier(node.name.name);
      node.name = t.jsxIdentifier(state.blueprintImport.name);
      if (elementPath.parent.closingElement) elementPath.parent.closingElement.name = t.jsxIdentifier(state.blueprintImport.name);
      node.attributes.push(
        t.jsxAttribute(t.jsxIdentifier('blueprintHost'), t.jsxExpressionContainer(original)),
        t.jsxAttribute(t.jsxIdentifier('blueprintSource'), t.jsxExpressionContainer(t.objectExpression([
          t.objectProperty(t.identifier('name'), t.stringLiteral(owner)),
          t.objectProperty(t.identifier('host'), t.stringLiteral(imported)),
          t.objectProperty(t.identifier('location'), location),
        ]))),
      );
      state.blueprintUsed = true;
    },
    JSXElement: {
      exit(elementPath, state) {
        const node = elementPath.node;
        if (!state.opts.componentUsages || state.blueprintUsageNodes.has(node) || !t.isJSXElement(node)) return;
        const file = sourceFile(state);
        const opening = node.openingElement;
        if (!file || !opening.loc) return;
        let tag = opening.name;
        const members = [];
        while (t.isJSXMemberExpression(tag)) { members.unshift(tag.property.name); tag = tag.object; }
        if (!t.isJSXIdentifier(tag) || !/^[A-Z]/.test(tag.name) || members.some(name => name === 'Provider' || name === 'Consumer')) return;
        const binding = elementPath.scope.getBinding(tag.name);
        if (!binding) return;
        if (binding.path.isImportSpecifier() || binding.path.isImportDefaultSpecifier() || binding.path.isImportNamespaceSpecifier()) {
          if (!binding.path.parent.source.value.startsWith('.')) return;
        } else if (!binding.path.isFunctionDeclaration() && !binding.path.isVariableDeclarator()) return;
        const component = [tag.name, ...members].join('.');
        const usage = t.objectExpression([
          t.objectProperty(t.identifier('component'), t.stringLiteral(component)),
          t.objectProperty(t.identifier('owner'), t.stringLiteral(ownerName(elementPath))),
          t.objectProperty(t.identifier('scope'), t.stringLiteral((state.opts.componentDirectories ?? []).some(prefix => file.startsWith(prefix)) ? 'component' : 'application')),
          t.objectProperty(t.identifier('location'), t.objectExpression([
            t.objectProperty(t.identifier('file'), t.stringLiteral(file)),
            t.objectProperty(t.identifier('line'), t.numericLiteral(opening.loc.start.line)),
            t.objectProperty(t.identifier('column'), t.numericLiteral(opening.loc.start.column + 1)),
          ])),
        ]);
        state.blueprintUsageNodes.add(node);
        state.blueprintUsageUsed = true;
        // Wrap the original React element, retaining its public key and original
        // refs/props/JSX runtime. No layout view or ref is added to the component.
        elementPath.replaceWith(t.callExpression(state.blueprintUsageImport, [node, usage]));
      },
    },
  },
});
