export const siteConfig = {
  name: 'Insight Blog',
  subtitle: '写代码，也记录代码之外的事。',
  description: 'Xiaoxin 的个人写作、随记与项目档案。',
  lang: 'zh-CN',
  author: 'Xiaoxin',
  github: 'https://github.com/xxx666i/insight-blog',
  avatar: '',
  about: {
    intro: '这里是 Xiaoxin 的长期个人档案。文章、短记和项目都通过 Git 留下清晰的版本与上下文。',
    interests: ['软件与工具', '写作与知识整理', '日常观察'],
    principles: ['先把问题说清楚', '让作品经得起时间', '保留好奇，也保留余白'],
    contact: '',
  },
} as const;

export const navigation = [
  { href: '/posts/', label: '文章' },
  { href: '/notes/', label: '随记' },
  { href: '/projects/', label: '项目' },
  { href: '/about/', label: '关于' },
] as const;

export const projectStatus = {
  'in-progress': '进行中',
  completed: '已完成',
  archived: '已归档',
} as const;
