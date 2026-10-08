import React, { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  BlueprintInspectable,
  type ReactNativeBlueprintScreen,
} from '@react-native-blueprint/react-native';

export type SocialPage =
  | 'Feed'
  | 'Thread'
  | 'Profile'
  | 'Notifications'
  | 'Search'
  | 'Compose'
  | 'Settings';
export type SocialState = 'ready' | 'loading' | 'empty' | 'error';
type Post = {
  id: string;
  author: string;
  handle: string;
  text: string;
  likes: number;
  replies: number;
  liked: boolean;
  topic: string;
};
const authors = [
  'Maya Chen',
  'Theo Park',
  'Amara Okafor',
  'Oliver James',
  'Sofia Rivera',
  'Noah Patel',
];
const topics = ['Design', 'Engineering', 'Photography', 'Open source'];
const messages = [
  'A small detail that makes a big difference: give people a clear way to understand what is happening on screen.',
  'Shipping our accessibility improvements today. Larger touch targets, clearer focus states, and better screen reader labels.',
  'Morning light on the coast. Taking a break from the screen always helps me see the work differently.',
  'We opened up our component library. Fixtures and real interactions make a much better demo than static screenshots.',
  'A few notes from building offline experiences: show cached data, explain freshness, and make recovery obvious.',
  'The best debugging tool answers a specific question. What changed? Which component? What data did it receive?',
];
export const SOCIAL_POSTS: Post[] = Array.from({ length: 72 }, (_, index) => ({
  id: `post-${index + 1}`,
  author: authors[index % authors.length],
  handle: `${authors[index % authors.length].toLowerCase().replace(' ', '.')}.example`,
  text: messages[index % messages.length],
  likes: 24 + index * 7,
  replies: 3 + (index % 12),
  liked: false,
  topic: topics[index % topics.length],
}));
export type SocialNavigationParams = { postId?: string; state?: SocialState; notice?: string };
const SocialAppContext = createContext<{
  posts: Post[];
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
} | undefined>(undefined);

export function SocialAppProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState(SOCIAL_POSTS);
  const value = useMemo(() => ({ posts, setPosts }), [posts]);
  return <SocialAppContext.Provider value={value}>{children}</SocialAppContext.Provider>;
}

function Action({
  label,
  onPress,
  active,
}: {
  label: string;
  onPress(): void;
  active?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: !!active }}
      onPress={onPress}
      style={[s.action, active && s.activeAction]}
    >
      <Text style={[s.actionText, active && { color: '#1673d1' }]}>
        {label}
      </Text>
    </Pressable>
  );
}
function Avatar({ author }: { author: string }) {
  return (
    <View
      style={[
        s.avatar,
        {
          backgroundColor:
            ['#ddd9fc', '#cce8db', '#f6dec8'][authors.indexOf(author) % 3] ??
            '#ddd9fc',
        },
      ]}
    >
      <Text style={s.avatarText}>
        {author
          .split(' ')
          .map((n) => n[0])
          .join('')}
      </Text>
    </View>
  );
}
function PostCard({
  post,
  like,
  open,
  profile,
}: {
  post: Post;
  like(): void;
  open(): void;
  profile(): void;
}) {
  return (

      <View style={s.post}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`View ${post.author} profile`}
          onPress={profile}
        >
          <Avatar author={post.author} />
        </Pressable>
        <View style={{ flex: 1, gap: 5 }}>
          <Text style={s.author}>
            {post.author} <Text style={s.time}>· 2h</Text>
          </Text>
          <Text style={s.handle}>@{post.handle}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Open thread ${post.id}`}
            onPress={open}
          >
            <Text style={s.body}>{post.text}</Text>
          </Pressable>
          <View style={s.postActions}>
            <Action
              label={`${post.liked ? '♥' : '♡'} ${post.likes}`}
              onPress={like}
              active={post.liked}
            />
            <Action label={`Replies ${post.replies}`} onPress={open} />
            <Text style={s.topic}>{post.topic}</Text>
          </View>
        </View>
      </View>

  );
}
export function SocialScreen({
  initialPage = 'Feed',
  initialState = 'ready',
  dark = false,
  initialPostId = 'post-1',
  notice: routeNotice = '',
  onNavigate,
  inspectionIdPrefix = '',
}: {
  initialPage?: SocialPage;
  initialState?: SocialState;
  dark?: boolean;
  initialPostId?: string;
  notice?: string;
  onNavigate?: (page: SocialPage, params?: SocialNavigationParams) => void;
  inspectionIdPrefix?: string;
}) {
  const [page, setPage] = useState<SocialPage>(initialPage);
  const [state, setState] = useState<SocialState>(initialState);
  const [localPosts, setLocalPosts] = useState(SOCIAL_POSTS);
  const shared = useContext(SocialAppContext);
  const posts = shared?.posts ?? localPosts;
  const setPosts = shared?.setPosts ?? setLocalPosts;
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState('');
  const [following, setFollowing] = useState(false);
  const [unread, setUnread] = useState(4);
  const [selectedPost, setSelectedPost] = useState(initialPostId);
  const [feed, setFeed] = useState('Following');
  const [loaded, setLoaded] = useState(8);
  const [notice, setNotice] = useState(routeNotice);
  useEffect(() => setState(initialState), [initialState]);
  useEffect(() => setSelectedPost(initialPostId), [initialPostId]);
  useEffect(() => setNotice(routeNotice), [routeNotice]);
  const visible = useMemo(
    () =>
      posts.filter((p) =>
        `${p.text} ${p.author} ${p.topic}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [posts, query],
  );
  const navigate = (next: SocialPage, params?: SocialNavigationParams) => {
    if (onNavigate) {
      onNavigate(next, params);
      return;
    }
    setPage(next);
    setState('ready');
    setQuery('');
    setNotice('');
  };
  const like = (id: string) =>
    setPosts((current) =>
      current.map((p) =>
        p.id === id
          ? { ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) }
          : p,
      ),
    );
  const open = (id: string) => {
    setSelectedPost(id);
    navigate('Thread', { postId: id });
  };
  const renderPost = (post: Post) => (
    <PostCard
      key={post.id}
      post={post}
      like={() => like(post.id)}
      open={() => open(post.id)}
      profile={() => navigate('Profile')}
    />
  );
  return (

    <View style={[s.app, dark && { backgroundColor: '#e9eef8' }]}>

        <View style={[s.header, dark && { backgroundColor: '#182b4b' }]}>
          <Text style={[s.brand, dark && { color: 'white' }]}>
            ◈ Open Social
          </Text>
          <Text style={s.eyebrow}>LOCAL FIXTURE · {page.toUpperCase()}</Text>
        </View>

      <ScrollView style={{ flex: 1 }}>
        {notice ? (
          <Text accessibilityLiveRegion="polite" style={s.notice}>
            {notice}
          </Text>
        ) : null}
        {state !== 'ready' ? (

            <View style={s.state}>
              {state === 'loading' ? (
                <ActivityIndicator color="#1673d1" />
              ) : null}
              <Text style={s.title}>
                {state === 'loading'
                  ? 'Loading your feed'
                  : state === 'error'
                    ? 'Could not load the feed'
                    : 'A fresh start'}
              </Text>
              <Text style={s.subtitle}>
                {state === 'error'
                  ? 'Your connection is offline. Retry with the local fixture.'
                  : state === 'empty'
                    ? 'Follow people to start a conversation.'
                    : 'Deterministic loading fixture'}
              </Text>
              <Action
                label={state === 'error' ? 'Retry feed' : 'Load sample posts'}
                onPress={() => setState('ready')}
              />
            </View>

        ) : (
          <>
            {page === 'Feed' ? (
              <>
                <View style={s.tabs}>
                  {['Following', 'Discover'].map((f) => (
                    <Action
                      key={f}
                      label={f}
                      active={feed === f}
                      onPress={() => setFeed(f)}
                    />
                  ))}
                  <Action
                    label="New post"
                    onPress={() => navigate('Compose')}
                  />
                </View>
                <Text style={s.section}>
                  YOUR COMMUNITY{' '}
                  <Text style={s.time}> / {posts.length} posts</Text>
                </Text>
                {(feed === 'Following' ? posts : [...posts].reverse())
                  .slice(0, loaded)
                  .map(renderPost)}
                <Action
                  label="Load more posts"
                  onPress={() =>
                    setLoaded((n) => Math.min(posts.length, n + 8))
                  }
                />
              </>
            ) : null}
            {page === 'Thread' ? (
              <>
                <Action label="Back to feed" onPress={() => navigate('Feed')} />
                <Text style={s.section}>CONVERSATION</Text>
                {posts.filter((p) => p.id === selectedPost).map(renderPost)}
                <Text style={s.section}>REPLIES</Text>
                {posts
                  .slice(2, 7)
                  .filter((p) => p.id !== selectedPost)
                  .map(renderPost)}
                <Action
                  label="Write a reply"
                  onPress={() => navigate('Compose')}
                />
              </>
            ) : null}
            {page === 'Profile' ? (
              <>
                <View style={s.banner}>
                  <Text style={s.bannerText}>Designing in the open.</Text>
                </View>

                  <View style={s.profile}>
                    <Avatar author={authors[0]} />
                    <Text style={s.title}>{authors[0]}</Text>
                    <Text style={s.handle}>@maya.chen.example</Text>
                    <Text style={s.body}>
                      Product designer. Building accessible experiences and
                      sharing the process. Melbourne, AU.
                    </Text>
                    <Text style={s.author}>
                      2,841 followers · 312 following
                    </Text>
                    <Action
                      label={following ? 'Following Maya' : 'Follow Maya'}
                      active={following}
                      onPress={() => setFollowing((f) => !f)}
                    />
                  </View>

                <Text style={s.section}>POSTS</Text>
                {posts
                  .filter((p) => p.author === authors[0])
                  .slice(0, 6)
                  .map(renderPost)}
              </>
            ) : null}
            {page === 'Notifications' ? (
              <>
                <View style={s.tabs}>
                  <Text style={s.title}>Activity</Text>
                  <Action label="Mark all read" onPress={() => setUnread(0)} />
                </View>

                  <View>
                    {authors.map((author, index) => (
                      <Pressable
                        key={author}
                        accessibilityRole="button"
                        accessibilityLabel={`Notification from ${author}`}
                        onPress={() => navigate('Profile')}
                        style={[
                          s.notification,
                          index < unread && { backgroundColor: '#eef6ff' },
                        ]}
                      >
                        <Avatar author={author} />
                        <View style={{ flex: 1 }}>
                          <Text style={s.author}>{author}</Text>
                          <Text style={s.body}>
                            {index % 2
                              ? 'started following you'
                              : 'liked your post'}
                          </Text>
                          <Text style={s.time}>{index + 1} hours ago</Text>
                        </View>
                      </Pressable>
                    ))}
                  </View>

              </>
            ) : null}
            {page === 'Search' ? (
              <>

                  <View style={s.profile}>
                    <Text style={s.title}>Find your people</Text>
                    <TextInput
                      accessibilityLabel="Search social posts"
                      placeholder="Search people, posts, topics"
                      value={query}
                      onChangeText={setQuery}
                      style={s.input}
                    />
                    <Text style={s.subtitle}>
                      {visible.length} local results
                    </Text>
                  </View>

                <View style={s.tabs}>
                  {topics.map((t) => (
                    <Action key={t} label={t} onPress={() => setQuery(t)} />
                  ))}
                </View>
                {visible.slice(0, loaded).map(renderPost)}
                {!visible.length ? (
                  <Text style={s.notice}>
                    No results. Try Engineering or Maya.
                  </Text>
                ) : null}
              </>
            ) : null}
            {page === 'Compose' ? (

                <View style={s.profile}>
                  <Text style={s.title}>Start a conversation</Text>
                  <Avatar author={authors[0]} />
                  <TextInput
                    accessibilityLabel="Post draft"
                    multiline
                    placeholder="What would you like to share?"
                    value={draft}
                    onChangeText={setDraft}
                    style={[
                      s.input,
                      { minHeight: 180, textAlignVertical: 'top' },
                    ]}
                  />
                  <Text style={s.subtitle}>
                    {draft.length} / 300 characters
                  </Text>
                  <Action
                    label="Publish local post"
                    onPress={() => {
                      if (!draft.trim() || draft.length > 300) {
                        setNotice('Write 1–300 characters to publish.');
                        return;
                      }
                      setPosts((p) => [
                        {
                          ...SOCIAL_POSTS[0],
                          id: `local-${p.length + 1}`,
                          text: draft.trim(),
                          likes: 0,
                          replies: 0,
                        },
                        ...p,
                      ]);
                      setDraft('');
                      navigate('Feed', { notice: 'Published locally. No network request was made.' });
                      setNotice(
                        'Published locally. No network request was made.',
                      );
                    }}
                  />
                </View>

            ) : null}
            {page === 'Settings' ? (
              <BlueprintInspectable
                name="SettingsPanel"
                id={`${inspectionIdPrefix}settings`}
                data={{
                  fixture: initialState,
                  theme: dark ? 'dim' : 'light',
                  storage: 'preview-local',
                  network: 'none',
                }}
              >
                <View style={s.profile}>
                  <Text style={s.title}>Preview settings</Text>
                  <Text style={s.body}>
                    Try realistic loading, empty, and recovery states. Each
                    artboard has its own local data.
                  </Text>
                  {(['loading', 'empty', 'error'] as SocialState[]).map((st) => (
                    <Action
                      key={st}
                      label={`Show ${st} state`}
                      onPress={() => {
                        if (onNavigate) onNavigate('Feed', { state: st });
                        else {
                          setPage('Feed');
                          setState(st);
                        }
                      }}
                    />
                  ))}
                  <Text style={s.subtitle}>
                    This showcase uses deterministic fixtures. The pinned
                    Bluesky source is available separately for a real-app
                    integration.
                  </Text>
                </View>
              </BlueprintInspectable>
            ) : null}
          </>
        )}
      </ScrollView>

        <View style={s.bottom}>
          {(['Feed', 'Search', 'Notifications', 'Profile'] as SocialPage[]).map(
            (p) => (
              <Action
                key={p}
                label={
                  p === 'Notifications' ? `Activity ${unread || ''}`.trim() : p
                }
                active={page === p}
                onPress={() => navigate(p)}
              />
            ),
          )}
        </View>

    </View>

  );
}
export const socialManifest: readonly ReactNativeBlueprintScreen[] = (
  [
    ['feed', 'Feed', 'ready', 'Following'],
    ['feed-loading', 'Feed', 'loading', 'Loading'],
    ['feed-empty', 'Feed', 'empty', 'Empty'],
    ['feed-error', 'Feed', 'error', 'Offline / retry'],
    ['thread', 'Thread', 'ready', 'Conversation'],
    ['profile', 'Profile', 'ready', 'Public profile'],
    ['notifications', 'Notifications', 'ready', 'Unread activity'],
    ['search', 'Search', 'ready', 'Search results'],
    ['compose', 'Compose', 'ready', 'New post'],
    ['settings', 'Settings', 'ready', 'Fixture controls'],
  ] as const
).map(([id, page, state, variant]) => ({
  id: `social-${id}`,
  name: page,
  render: () => <SocialScreen initialPage={page} initialState={state} />,
  route: { pathname: `/social/${page.toLowerCase()}`, params: { state } },
  viewport: { width: 390, height: 844, name: 'Standard phone' },
  metadata: {
    fixture: variant,
    dataset: '72 deterministic posts / 6 authors',
    state,
    source: 'showcase/SocialApp.tsx',
    network: 'offline',
    provenance:
      'Original local fixture app; Bluesky reference cloned separately',
  },
}));
const s = StyleSheet.create({
  app: { flex: 1, backgroundColor: '#fff' },
  header: { padding: 18, gap: 5, borderBottomWidth: 1, borderColor: '#e2e9f2' },
  brand: {
    color: '#1673d1',
    fontSize: 23,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  eyebrow: {
    color: '#6b8199',
    fontSize: 9,
    letterSpacing: 1.5,
    fontWeight: '600',
  },
  tabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: 9,
    borderBottomWidth: 1,
    borderColor: '#e2e9f2',
  },
  action: { paddingVertical: 9, paddingHorizontal: 9, borderRadius: 7 },
  activeAction: { backgroundColor: '#e8f3ff' },
  actionText: { color: '#5e7289', fontSize: 12, fontWeight: '600' },
  post: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#e2e9f2',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ddd9fc',
  },
  avatarText: { color: '#40557d', fontSize: 13, fontWeight: '700' },
  author: { color: '#172d47', fontSize: 14, fontWeight: '700' },
  handle: { color: '#7990a6', fontSize: 11 },
  body: { color: '#30465e', fontSize: 14, lineHeight: 21 },
  time: { color: '#8093a7', fontSize: 11, fontWeight: '400' },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  topic: { color: '#8494ad', fontSize: 10 },
  section: {
    color: '#7890a8',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    padding: 15,
    backgroundColor: '#f6f9fc',
  },
  title: { color: '#19344f', fontSize: 22, fontWeight: '700' },
  subtitle: { color: '#6d839b', fontSize: 13, lineHeight: 20 },
  profile: { padding: 20, gap: 12 },
  banner: {
    height: 112,
    backgroundColor: '#dee9f8',
    padding: 24,
    justifyContent: 'center',
  },
  bannerText: { color: '#4771a3', fontSize: 23, fontWeight: '700' },
  notification: {
    padding: 18,
    flexDirection: 'row',
    gap: 14,
    borderBottomWidth: 1,
    borderColor: '#e2e9f2',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d2ddeb',
    padding: 14,
    borderRadius: 10,
    color: '#243c56',
    fontSize: 14,
  },
  bottom: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderColor: '#e2e9f2',
    padding: 6,
  },
  state: {
    minHeight: 400,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 15,
  },
  notice: {
    backgroundColor: '#edf5fc',
    color: '#336084',
    padding: 14,
    fontSize: 12,
  },
});
