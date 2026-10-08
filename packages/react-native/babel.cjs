const path = require('node:path');
const hosts = new Set(['View', 'Text', 'Pressable', 'ScrollView', 'TextInput', 'Image', 'ActivityIndicator', 'TouchableOpacity', 'TouchableHighlight', 'TouchableWithoutFeedback', 'SafeAreaView', 'Switch', 'FlatList', 'SectionList']);

// Build-time instrumentation: preserves host layout, keys, refs and original props.
module.exports = ({ types: t }) => ({
  name: 'blueprint-source',
  visitor: {
    Program: {
      enter(program, state) {
        state.blueprintImport = program.scope.generateUidIdentifier('BlueprintSourceElement');
        state.blueprintUsed = false;
      },
      exit(program, state) {
        if (state.blueprintUsed) program.unshiftContainer('body', t.importDeclaration([
          t.importSpecifier(state.blueprintImport, t.identifier('BlueprintSourceElement')),
        ], t.stringLiteral('@react-native-blueprint/react-native')));
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
      let owner = 'Anonymous';
      for (let scope = elementPath.scope; scope; scope = scope.parent) {
        const p = scope.path;
        const name = p.isFunctionDeclaration() ? p.node.id?.name : p.isFunction() && p.parentPath.isVariableDeclarator() ? p.parentPath.node.id.name : undefined;
        if (name && /^[A-Z]/.test(name)) { owner = name; break; }
      }
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
  },
});
