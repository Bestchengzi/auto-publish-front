import type { AppLocale } from "@/i18n/config";

export type SeoPageKind = "platforms" | "scenarios";

export type SeoDetailPage = {
  slug: string;
  title: Record<AppLocale, string>;
  description: Record<AppLocale, string>;
  keywords: Record<AppLocale, string[]>;
  badge: Record<AppLocale, string>;
  heading: Record<AppLocale, string>;
  lead: Record<AppLocale, string>;
  highlightsTitle: Record<AppLocale, string>;
  highlights: Record<AppLocale, string[]>;
  workflowTitle: Record<AppLocale, string>;
  workflow: Record<AppLocale, string[]>;
  faq: Record<AppLocale, Array<{ question: string; answer: string }>>;
};

export const platformSeoPages: SeoDetailPage[] = [
  {
    slug: "xiaohongshu",
    title: {
      "zh-CN": "AI小红书图文生成工具 - 小红书笔记与文案生成 | KeduckAI",
      en: "AI Xiaohongshu Post Generator - Notes and Copy Creation | KeduckAI",
    },
    description: {
      "zh-CN":
        "KeduckAI 支持一句话生成小红书图文、小红书笔记、小红书文案、标题、正文、标签和图片文案，适合种草、探店、产品推广和品牌宣传。",
      en: "KeduckAI generates Xiaohongshu image-text posts, notes, copy, titles, body text, tags, and image copy from one topic for product seeding, store visits, campaigns, and brand promotion.",
    },
    keywords: {
      "zh-CN": ["AI小红书图文生成工具", "小红书图文生成工具", "小红书笔记生成", "小红书文案生成", "小红书爆款图文", "小红书种草文案"],
      en: ["AI Xiaohongshu post generator", "Xiaohongshu post generator", "Xiaohongshu notes generator", "Xiaohongshu copy generator", "Xiaohongshu image-text posts"],
    },
    badge: { "zh-CN": "平台专题", en: "Platform Guide" },
    heading: { "zh-CN": "AI小红书图文生成工具", en: "AI Xiaohongshu Post Generator" },
    lead: {
      "zh-CN":
        "输入一句话主题、产品卖点或内容方向，即可生成适合小红书发布的图文笔记。KeduckAI 会围绕标题吸引力、正文种草表达、标签和图片文案分别生成，而不是把长文章简单改短。",
      en: "Enter one topic, product selling point, or content direction to generate Xiaohongshu-ready image-text notes. KeduckAI treats titles, seeding copy, tags, and image copy as separate outputs instead of shortening a long article.",
    },
    highlightsTitle: { "zh-CN": "适合的小红书内容场景", en: "Best-fit Xiaohongshu scenarios" },
    highlights: {
      "zh-CN": ["产品种草与卖点表达", "探店、活动、新品推广", "品牌宣传与账号日常更新", "标题、正文、标签和图片文案生成"],
      en: ["Product seeding and selling-point copy", "Store visits, campaigns, and new product launches", "Brand promotion and routine account updates", "Titles, body copy, tags, and image copy generation"],
    },
    workflowTitle: { "zh-CN": "从选题到发布的流程", en: "Workflow from topic to publishing" },
    workflow: {
      "zh-CN": ["从选题灵感中选择方向，或直接输入一句话主题。", "生成小红书图文内容，检查标题、正文、标签和图片文案。", "编辑确认后，通过对话发布或手动发布到目标账号。"],
      en: ["Choose a topic from topic inspiration or enter a one-sentence brief.", "Generate Xiaohongshu post content and review titles, body copy, tags, and image copy.", "Confirm the draft, then publish by chat command or manual publishing."],
    },
    faq: {
      "zh-CN": [
        { question: "KeduckAI 可以生成小红书爆款图文吗？", answer: "可以。它会围绕小红书图文笔记的内容结构生成标题、正文、标签和图片文案，适合种草、探店、产品推广和品牌宣传。" },
        { question: "小红书图文和其他平台文章是同一种生成方式吗？", answer: "不是。小红书更重视图文笔记、标题吸引力、标签和图片文案，KeduckAI 会与公众号、知乎、头条、CSDN 等文章内容分开生成。" },
      ],
      en: [
        { question: "Can KeduckAI generate Xiaohongshu image-text posts?", answer: "Yes. It generates titles, note-style body copy, tags, and image copy for Xiaohongshu scenarios such as seeding, store visits, product promotion, and brand content." },
        { question: "Are Xiaohongshu posts generated the same way as long-form articles?", answer: "No. Xiaohongshu focuses on note-style posts, title appeal, tags, and image copy, so KeduckAI generates it separately from WeChat, Zhihu, Toutiao, and CSDN articles." },
      ],
    },
  },
  {
    slug: "wechat",
    title: {
      "zh-CN": "AI公众号文章生成工具 - 微信公众号文章创作与发布 | KeduckAI",
      en: "AI WeChat Official Account Article Generator | KeduckAI",
    },
    description: {
      "zh-CN":
        "KeduckAI 支持公众号文章生成、智能配图、多种美观内容排版、编辑确认和发布，适合精品文章、深度观点、知识科普、品牌传播、产品介绍和企业内容运营。",
      en: "KeduckAI supports WeChat Official Account article generation, smart visuals, polished content layouts, editing confirmation, and publishing for premium long-form posts, deep-dive viewpoints, educational content, brand communication, product introductions, and enterprise content operations.",
    },
    keywords: {
      "zh-CN": ["AI公众号文章生成工具", "公众号文章生成", "微信公众号文章创作", "AI写作工具", "企业内容营销"],
      en: ["AI WeChat article generator", "WeChat Official Account articles", "AI writing tool", "content marketing platform"],
    },
    badge: { "zh-CN": "平台专题", en: "Platform Guide" },
    heading: { "zh-CN": "AI公众号文章生成工具", en: "AI WeChat Official Account Article Generator" },
    lead: {
      "zh-CN":
        "面向公众号文章创作，KeduckAI 更关注选题、标题、文章结构、观点展开、段落表达、图文完整度和内容排版效果，帮助内容创作者、品牌和团队更快完成可发布、好阅读的公众号文章草稿。",
      en: "For WeChat Official Account creation, KeduckAI focuses on topics, titles, article structure, argument development, section writing, visual completeness, and layout quality so creators, brands, and teams can move faster from idea to readable, publishable drafts.",
    },
    highlightsTitle: { "zh-CN": "适合的公众号内容", en: "Best-fit WeChat article content" },
    highlights: {
      "zh-CN": ["精品文章和深度观点", "知识科普和经验分享", "多种美观内容排版", "品牌故事、产品介绍与发布确认"],
      en: ["Premium articles and deep-dive viewpoints", "Educational content and experience sharing", "Polished content layout options", "Brand stories, product introductions, and publishing confirmation"],
    },
    workflowTitle: { "zh-CN": "公众号文章创作流程", en: "WeChat article workflow" },
    workflow: {
      "zh-CN": ["输入选题、观点、知识主题、产品信息或活动需求。", "生成标题、文章结构、正文段落、配图和排版建议。", "编辑确认后选择公众号账号发布，或保存为草稿继续优化。"],
      en: ["Enter a topic, viewpoint, knowledge theme, product information, or campaign brief.", "Generate title options, article structure, body sections, visuals, and layout suggestions.", "Confirm the draft, publish to the selected account, or save it for further editing."],
    },
    faq: {
      "zh-CN": [
        { question: "KeduckAI 适合写公众号长文吗？", answer: "适合。公众号文章更强调结构、观点、案例和完整表达，KeduckAI 会按文章逻辑生成，不会按小红书图文方式处理。" },
        { question: "公众号文章支持好看的内容排版吗？", answer: "支持。KeduckAI 可结合文章主题、段落结构和发布场景生成更适合公众号阅读的图文排版建议，让内容更完整、更适合发布。" },
      ],
      en: [
        { question: "Is KeduckAI suitable for long-form WeChat articles?", answer: "Yes. WeChat articles need structure, viewpoints, cases, and complete expression, so KeduckAI generates them as long-form articles rather than Xiaohongshu-style posts." },
        { question: "Does WeChat article generation support polished content layouts?", answer: "Yes. KeduckAI can combine the topic, section structure, and publishing scenario to suggest WeChat-friendly visual layouts, making the article more complete and publication-ready." },
      ],
    },
  },
  {
    slug: "toutiao",
    title: {
      "zh-CN": "AI头条文章生成工具 - 今日头条内容创作与发布 | KeduckAI",
      en: "AI Toutiao Article Generator - News Feed Content Creation | KeduckAI",
    },
    description: {
      "zh-CN": "KeduckAI 支持头条文章生成、热点解读、快讯追踪、智能配图和自动发布，帮助自媒体运营快速完成头条内容生产。",
      en: "KeduckAI supports Toutiao article generation, trend commentary, news tracking, smart visuals, and auto-publishing for faster information-feed content production.",
    },
    keywords: {
      "zh-CN": ["AI头条文章生成工具", "头条文章生成", "今日头条内容创作", "热点文章生成", "自媒体运营工具"],
      en: ["AI Toutiao article generator", "Toutiao articles", "trend commentary generator", "social media operation tool"],
    },
    badge: { "zh-CN": "平台专题", en: "Platform Guide" },
    heading: { "zh-CN": "AI头条文章生成工具", en: "AI Toutiao Article Generator" },
    lead: {
      "zh-CN":
        "面向今日头条内容场景，KeduckAI 适合生成热点解读、快讯追踪、大众阅读型文章和品牌资讯内容，帮助运营人员把选题快速转化为可发布文章。",
      en: "For Toutiao scenarios, KeduckAI helps generate trend commentary, news tracking, accessible articles, and brand information posts so operators can turn topics into publishable articles quickly.",
    },
    highlightsTitle: { "zh-CN": "适合的头条内容", en: "Best-fit Toutiao content" },
    highlights: {
      "zh-CN": ["热点解读和资讯追踪", "大众阅读型知识内容", "品牌资讯和活动传播", "智能配图与多平台发布"],
      en: ["Trend commentary and news tracking", "Accessible knowledge content", "Brand updates and campaigns", "Smart visuals and multi-platform publishing"],
    },
    workflowTitle: { "zh-CN": "头条文章生产流程", en: "Toutiao article workflow" },
    workflow: {
      "zh-CN": ["从选题灵感选择热点方向，或输入要追踪的话题。", "生成头条文章标题、结构、正文和配图。", "确认内容后手动发布或纳入定时自动发布计划。"],
      en: ["Choose a trend from topic inspiration or enter a topic to track.", "Generate Toutiao titles, structure, body sections, and visuals.", "Confirm the content, then publish manually or add it to a scheduled auto-publishing plan."],
    },
    faq: {
      "zh-CN": [
        { question: "KeduckAI 可以用于头条热点内容吗？", answer: "可以。它适合把热点方向、资讯主题或观点选题快速生成头条文章草稿。" },
        { question: "头条文章可以自动发布吗？", answer: "可以。内容确认后可选择手动发布，也可以通过定时计划按时间自动生成并发布。" },
      ],
      en: [
        { question: "Can KeduckAI create Toutiao trend content?", answer: "Yes. It can turn trend directions, news topics, or viewpoint briefs into Toutiao article drafts quickly." },
        { question: "Can Toutiao articles be auto-published?", answer: "Yes. After confirmation, content can be manually published or generated and published on schedule." },
      ],
    },
  },
  {
    slug: "zhihu",
    title: {
      "zh-CN": "AI知乎文章生成工具 - 知乎回答与知识内容创作 | KeduckAI",
      en: "AI Zhihu Article Generator - Answers and Knowledge Content | KeduckAI",
    },
    description: {
      "zh-CN": "KeduckAI 支持知乎文章和知乎回答内容生成，强调观点表达、逻辑结构、经验分享、知识讲解和智能配图。",
      en: "KeduckAI generates Zhihu articles and answers with stronger viewpoint expression, logical structure, experience sharing, knowledge explanation, and smart visuals.",
    },
    keywords: {
      "zh-CN": ["AI知乎文章生成工具", "知乎文章生成", "知乎回答生成", "知识内容创作", "AI文章生成"],
      en: ["AI Zhihu article generator", "Zhihu articles", "Zhihu answer generator", "knowledge content creation", "AI article generator"],
    },
    badge: { "zh-CN": "平台专题", en: "Platform Guide" },
    heading: { "zh-CN": "AI知乎文章生成工具", en: "AI Zhihu Article Generator" },
    lead: {
      "zh-CN":
        "知乎内容更看重观点、逻辑和可信表达。KeduckAI 可根据选题生成更适合知乎阅读场景的文章结构、论点展开、案例段落和知识讲解内容。",
      en: "Zhihu content values viewpoints, logic, and credible expression. KeduckAI generates article structures, argument development, examples, and knowledge explanations for Zhihu reading scenarios.",
    },
    highlightsTitle: { "zh-CN": "适合的知乎内容", en: "Best-fit Zhihu content" },
    highlights: {
      "zh-CN": ["知乎回答和观点文章", "经验分享和方法论总结", "知识讲解和科普内容", "结构化表达与智能配图"],
      en: ["Zhihu answers and opinion articles", "Experience sharing and methodology summaries", "Knowledge explanations and educational content", "Structured writing and smart visuals"],
    },
    workflowTitle: { "zh-CN": "知乎内容生成流程", en: "Zhihu content workflow" },
    workflow: {
      "zh-CN": ["输入问题、观点或知识主题。", "生成论点结构、正文段落、案例和结论。", "编辑事实、案例和表述后发布到知乎账号。"],
      en: ["Enter a question, viewpoint, or knowledge topic.", "Generate argument structure, sections, examples, and conclusion.", "Review facts, cases, and wording before publishing to Zhihu."],
    },
    faq: {
      "zh-CN": [
        { question: "KeduckAI 适合知乎回答吗？", answer: "适合。它会更重视观点、逻辑、案例和可信表达，帮助生成适合知乎阅读的内容。" },
        { question: "知乎内容和公众号文章有什么区别？", answer: "知乎更偏问答、观点和经验分享，公众号更偏品牌传播、深度文章和活动内容，KeduckAI 会按平台场景分别生成。" },
      ],
      en: [
        { question: "Is KeduckAI suitable for Zhihu answers?", answer: "Yes. It focuses on viewpoint, logic, examples, and credible expression for Zhihu-style reading." },
        { question: "How is Zhihu content different from WeChat articles?", answer: "Zhihu leans toward Q&A, opinions, and experience sharing, while WeChat is more often used for brand stories, long-form articles, and campaigns. KeduckAI generates them separately." },
      ],
    },
  },
  {
    slug: "baijiahao",
    title: {
      "zh-CN": "AI百家号文章生成工具 - 百度内容生态创作与发布 | KeduckAI",
      en: "AI Baijiahao Article Generator - Baidu Content Ecosystem | KeduckAI",
    },
    description: {
      "zh-CN": "KeduckAI 支持百家号文章生成与发布，适合百度内容生态、品牌曝光、知识分享、资讯内容和企业内容营销。",
      en: "KeduckAI supports Baijiahao article generation and publishing for Baidu content ecosystem exposure, brand visibility, knowledge sharing, news content, and content marketing.",
    },
    keywords: {
      "zh-CN": ["AI百家号文章生成工具", "百家号文章生成", "百度内容生态", "品牌曝光内容", "AI内容生成工具"],
      en: ["AI Baijiahao article generator", "Baijiahao articles", "Baidu content ecosystem", "AI content generation tool"],
    },
    badge: { "zh-CN": "平台专题", en: "Platform Guide" },
    heading: { "zh-CN": "AI百家号文章生成工具", en: "AI Baijiahao Article Generator" },
    lead: {
      "zh-CN":
        "百家号适合承接百度内容生态中的品牌曝光、知识分享和资讯传播。KeduckAI 可以围绕主题生成文章结构、正文内容、配图和发布文案。",
      en: "Baijiahao is useful for brand exposure, knowledge sharing, and information distribution in the Baidu content ecosystem. KeduckAI generates article structure, body content, visuals, and publishing copy around a topic.",
    },
    highlightsTitle: { "zh-CN": "适合的百家号内容", en: "Best-fit Baijiahao content" },
    highlights: {
      "zh-CN": ["百度内容生态曝光", "品牌宣传和企业资讯", "知识分享和行业观点", "文章生成、配图与发布"],
      en: ["Baidu ecosystem exposure", "Brand promotion and company updates", "Knowledge sharing and industry viewpoints", "Article generation, visuals, and publishing"],
    },
    workflowTitle: { "zh-CN": "百家号文章生成流程", en: "Baijiahao article workflow" },
    workflow: {
      "zh-CN": ["输入品牌、行业或知识主题。", "生成百家号文章标题、结构、正文和配图。", "确认内容后发布到百家号账号并查看发布记录。"],
      en: ["Enter a brand, industry, or knowledge topic.", "Generate Baijiahao titles, structure, body sections, and visuals.", "Confirm and publish to Baijiahao, then review publishing records."],
    },
    faq: {
      "zh-CN": [
        { question: "KeduckAI 支持百家号文章吗？", answer: "支持。KeduckAI 可生成百家号文章内容，并覆盖标题、正文结构、配图和发布流程。" },
        { question: "百家号适合哪些运营场景？", answer: "适合百度内容生态曝光、品牌宣传、知识分享、资讯内容和企业内容营销。" },
      ],
      en: [
        { question: "Does KeduckAI support Baijiahao articles?", answer: "Yes. KeduckAI can generate Baijiahao article content, including titles, structure, visuals, and publishing workflows." },
        { question: "Which scenarios fit Baijiahao?", answer: "It fits Baidu ecosystem exposure, brand promotion, knowledge sharing, information content, and enterprise content marketing." },
      ],
    },
  },
  {
    slug: "csdn",
    title: {
      "zh-CN": "AI CSDN文章生成工具 - 技术文章与教程生成 | KeduckAI",
      en: "AI CSDN Article Generator - Technical Tutorials and Guides | KeduckAI",
    },
    description: {
      "zh-CN": "KeduckAI 支持 CSDN 技术文章生成，适合教程、问题解决方案、经验总结、开发笔记和技术知识分享。",
      en: "KeduckAI supports CSDN technical article generation for tutorials, troubleshooting guides, experience summaries, developer notes, and technical knowledge sharing.",
    },
    keywords: {
      "zh-CN": ["AI CSDN文章生成工具", "CSDN文章生成", "技术文章生成", "AI技术教程生成", "AI文章生成"],
      en: ["AI CSDN article generator", "CSDN articles", "technical article generator", "AI tutorial generator", "AI article generator"],
    },
    badge: { "zh-CN": "平台专题", en: "Platform Guide" },
    heading: { "zh-CN": "AI CSDN文章生成工具", en: "AI CSDN Article Generator" },
    lead: {
      "zh-CN":
        "面向技术创作者，KeduckAI 可将技术主题、报错问题、开发经验或教程提纲生成适合 CSDN 发布的技术文章，帮助内容更清晰、更有结构。",
      en: "For technical creators, KeduckAI turns technical topics, error cases, development experience, or tutorial outlines into CSDN-ready articles with clearer structure.",
    },
    highlightsTitle: { "zh-CN": "适合的 CSDN 内容", en: "Best-fit CSDN content" },
    highlights: {
      "zh-CN": ["技术教程和入门指南", "报错排查和解决方案", "开发经验和工具使用总结", "技术文章结构化生成"],
      en: ["Technical tutorials and beginner guides", "Troubleshooting and solutions", "Development experience and tool summaries", "Structured technical article generation"],
    },
    workflowTitle: { "zh-CN": "CSDN文章生成流程", en: "CSDN article workflow" },
    workflow: {
      "zh-CN": ["输入技术主题、问题描述或教程大纲。", "生成文章结构、步骤说明、代码解释和总结。", "检查技术细节后发布到 CSDN 账号。"],
      en: ["Enter a technical topic, problem description, or tutorial outline.", "Generate structure, step-by-step explanation, code explanation, and summary.", "Review technical details before publishing to CSDN."],
    },
    faq: {
      "zh-CN": [
        { question: "KeduckAI 能写技术文章吗？", answer: "可以。CSDN 场景适合生成教程、问题解决方案、经验总结和开发笔记。" },
        { question: "技术文章发布前需要人工检查吗？", answer: "建议检查。涉及代码、版本、依赖、错误原因等内容时，发布前应确认准确性。" },
      ],
      en: [
        { question: "Can KeduckAI write technical articles?", answer: "Yes. CSDN scenarios fit tutorials, troubleshooting guides, experience summaries, and developer notes." },
        { question: "Should technical articles be reviewed before publishing?", answer: "Yes. For code, versions, dependencies, and error analysis, review the details before publishing." },
      ],
    },
  },
];

export const scenarioSeoPages: SeoDetailPage[] = [
  {
    slug: "ai-writing-tool",
    title: {
      "zh-CN": "AI写作工具 - 多平台文章与小红书图文生成 | KeduckAI",
      en: "AI Writing Tool for Multi-platform Articles and Xiaohongshu Posts | KeduckAI",
    },
    description: {
      "zh-CN": "KeduckAI 是面向内容创作者、自媒体运营和企业营销的 AI写作工具，支持小红书图文、公众号、头条、知乎、百家号和 CSDN 文章生成。",
      en: "KeduckAI is an AI writing tool for creators, social media operators, and enterprise marketers, supporting Xiaohongshu posts, WeChat, Toutiao, Zhihu, Baijiahao, and CSDN articles.",
    },
    keywords: {
      "zh-CN": ["AI写作工具", "AI文章生成", "AI内容生成工具", "小红书图文生成", "多平台文章生成"],
      en: ["AI writing tool", "AI article generator", "AI content generation tool", "multi-platform article generator"],
    },
    badge: { "zh-CN": "场景专题", en: "Scenario Guide" },
    heading: { "zh-CN": "面向多平台内容生产的 AI写作工具", en: "AI Writing Tool for Multi-platform Content Production" },
    lead: {
      "zh-CN": "KeduckAI 不只是生成一段通用文案，而是根据小红书图文、公众号文章、头条文章、知乎文章、百家号文章和 CSDN 文章的不同内容场景分别生成。",
      en: "KeduckAI does not produce one generic draft for every channel. It generates separately for Xiaohongshu posts, WeChat articles, Toutiao articles, Zhihu articles, Baijiahao articles, and CSDN articles.",
    },
    highlightsTitle: { "zh-CN": "AI写作覆盖内容", en: "What the AI writing workflow covers" },
    highlights: {
      "zh-CN": ["小红书图文、笔记和文案", "公众号、头条、知乎、百家号文章", "CSDN 技术文章和教程", "标题、正文、标签、配图和发布文案"],
      en: ["Xiaohongshu posts, notes, and copy", "WeChat, Toutiao, Zhihu, and Baijiahao articles", "CSDN technical articles and tutorials", "Titles, body content, tags, visuals, and publishing copy"],
    },
    workflowTitle: { "zh-CN": "AI写作工具使用流程", en: "AI writing workflow" },
    workflow: {
      "zh-CN": ["选择平台或内容类型。", "输入一句话主题或使用选题灵感。", "生成内容、智能配图、编辑确认并发布。"],
      en: ["Choose a platform or content type.", "Enter a one-sentence topic or use topic inspiration.", "Generate content, add smart visuals, confirm edits, and publish."],
    },
    faq: {
      "zh-CN": [
        { question: "KeduckAI 和普通 AI 写作工具有什么不同？", answer: "KeduckAI 更强调平台内容差异和发布执行，支持小红书图文、文章生成、智能配图、对话发布、手动发布和自动发布。" },
        { question: "是否适合企业营销使用？", answer: "适合。企业可以用于品牌宣传、产品介绍、活动推广、客户案例和行业观点输出。" },
      ],
      en: [
        { question: "How is KeduckAI different from a generic AI writing tool?", answer: "KeduckAI focuses on platform-specific content and publishing execution, covering Xiaohongshu posts, article generation, smart visuals, chat publishing, manual publishing, and auto-publishing." },
        { question: "Is it suitable for enterprise marketing?", answer: "Yes. Teams can use it for brand promotion, product introductions, campaigns, customer cases, and industry viewpoints." },
      ],
    },
  },
  {
    slug: "ai-creation-platform",
    title: {
      "zh-CN": "AI创作平台 - 从选题灵感到自动发布 | KeduckAI",
      en: "AI Creation Platform from Topic Inspiration to Auto-publishing | KeduckAI",
    },
    description: {
      "zh-CN": "KeduckAI 是覆盖选题灵感、AI内容生成、智能配图、编辑确认、自动发布和发布记录的 AI创作平台。",
      en: "KeduckAI is an AI creation platform covering topic inspiration, AI content generation, smart visuals, editing confirmation, auto-publishing, and publishing records.",
    },
    keywords: {
      "zh-CN": ["AI创作平台", "自媒体选题工具", "AI内容生成工具", "内容生产流程", "自动发布工具"],
      en: ["AI creation platform", "self-media topic tool", "AI content generation tool", "content production workflow", "auto-publishing tool"],
    },
    badge: { "zh-CN": "场景专题", en: "Scenario Guide" },
    heading: { "zh-CN": "从选题灵感到自动发布的 AI创作平台", en: "AI Creation Platform from Topic Inspiration to Auto-publishing" },
    lead: {
      "zh-CN": "KeduckAI 把找选题、写内容、配图片、编辑确认、发布执行和发布记录放进同一套流程，适合需要持续更新内容的创作者和团队。",
      en: "KeduckAI brings topic discovery, writing, visuals, editing, publishing execution, and publishing records into one workflow for creators and teams that need continuous content output.",
    },
    highlightsTitle: { "zh-CN": "平台核心能力", en: "Core platform capabilities" },
    highlights: {
      "zh-CN": ["选题灵感和热门方向", "AI内容生成和AI文章生成", "智能配图和编辑确认", "对话发布、手动发布和自动发布"],
      en: ["Topic inspiration and trending directions", "AI content generation and AI article generation", "Smart visuals and editing confirmation", "Chat publishing, manual publishing, and auto-publishing"],
    },
    workflowTitle: { "zh-CN": "创作平台流程", en: "Creation platform workflow" },
    workflow: {
      "zh-CN": ["用选题灵感找到可写方向。", "按平台生成图文或文章内容。", "确认内容后执行发布，并在发布记录中追踪结果。"],
      en: ["Use topic inspiration to find workable directions.", "Generate posts or article content by platform.", "Confirm and publish, then track results in publishing records."],
    },
    faq: {
      "zh-CN": [
        { question: "KeduckAI 是 AI创作平台还是单纯写作工具？", answer: "它更接近 AI创作平台，因为覆盖选题、生成、配图、编辑、发布和记录查看，而不仅是写一段文案。" },
        { question: "选题灵感有什么用？", answer: "选题灵感帮助用户获取写作素材、热门话题、内容方向和创作角度，解决不知道写什么的问题。" },
      ],
      en: [
        { question: "Is KeduckAI an AI creation platform or just a writing tool?", answer: "It is closer to an AI creation platform because it covers topic inspiration, generation, visuals, editing, publishing, and record review." },
        { question: "What does topic inspiration do?", answer: "Topic inspiration helps users find writing materials, trending topics, content directions, and creative angles when they do not know what to write." },
      ],
    },
  },
  {
    slug: "self-media-tool",
    title: {
      "zh-CN": "自媒体工具 - 小红书图文与多平台内容创作发布 | KeduckAI",
      en: "Self-media Tool for Xiaohongshu and Multi-platform Content | KeduckAI",
    },
    description: {
      "zh-CN": "KeduckAI 是面向自媒体运营和内容创作者的 AI自媒体工具，支持选题灵感、小红书图文、公众号文章、头条文章、知乎文章、百家号文章、CSDN文章生成、智能配图、发布和矩阵运营。",
      en: "KeduckAI is an AI self-media tool for social media operators and content creators, supporting topic inspiration, Xiaohongshu posts, WeChat articles, Toutiao articles, Zhihu articles, Baijiahao articles, CSDN articles, smart visuals, publishing, and content matrix operations.",
    },
    keywords: {
      "zh-CN": ["自媒体工具", "AI自媒体工具", "自媒体运营工具", "自媒体内容创作工具", "自媒体发布工具", "小红书图文生成"],
      en: ["self-media tool", "AI self-media tool", "social media operation tool", "self-media content creation tool", "multi-platform publishing tool", "Xiaohongshu post generator"],
    },
    badge: { "zh-CN": "场景专题", en: "Scenario Guide" },
    heading: { "zh-CN": "面向自媒体运营的 AI自媒体工具", en: "AI Self-media Tool for Content Operations" },
    lead: {
      "zh-CN": "自媒体运营需要持续找选题、写内容、配图片、确认发布并维护多个账号。KeduckAI 把小红书图文、多平台文章生成、智能配图和发布执行放进同一套流程，帮助创作者更稳定地完成内容更新。",
      en: "Self-media operations require continuous topic discovery, writing, visuals, publishing confirmation, and multi-account maintenance. KeduckAI brings Xiaohongshu posts, multi-platform article generation, smart visuals, and publishing execution into one workflow for more stable content updates.",
    },
    highlightsTitle: { "zh-CN": "适合的自媒体工作", en: "Best-fit self-media work" },
    highlights: {
      "zh-CN": ["选题灵感和账号内容方向", "小红书图文与多平台文章生成", "智能配图和公众号内容排版", "对话发布、手动发布、定时发布与矩阵运营"],
      en: ["Topic inspiration and account content direction", "Xiaohongshu posts and multi-platform articles", "Smart visuals and WeChat article layouts", "Chat publishing, manual publishing, scheduled publishing, and content matrix operations"],
    },
    workflowTitle: { "zh-CN": "自媒体内容生产流程", en: "Self-media content workflow" },
    workflow: {
      "zh-CN": ["通过选题灵感确定内容方向，也可以设置账号人设和表达风格。", "选择小红书图文、公众号、头条、知乎、百家号或 CSDN 等内容类型。", "生成内容并完成配图、编辑确认、发布执行和发布记录查看。"],
      en: ["Use topic inspiration to define the content direction, and set account persona or voice when needed.", "Choose Xiaohongshu posts, WeChat, Toutiao, Zhihu, Baijiahao, CSDN, or another content type.", "Generate content, add visuals, confirm edits, publish, and review publishing records."],
    },
    faq: {
      "zh-CN": [
        { question: "KeduckAI 适合做自媒体运营吗？", answer: "适合。它覆盖选题灵感、内容生成、智能配图、编辑确认、发布执行和发布记录查看，适合需要持续更新小红书、公众号、头条、知乎、百家号、CSDN 等账号的用户。" },
        { question: "KeduckAI 和普通自媒体工具有什么不同？", answer: "KeduckAI 更强调 AI 内容生成质量和平台内容场景差异，同时提供发布和矩阵运营能力，不只是简单管理账号或复制分发内容。" },
      ],
      en: [
        { question: "Is KeduckAI suitable for self-media operations?", answer: "Yes. It covers topic inspiration, content generation, smart visuals, editing confirmation, publishing execution, and publishing records for users who continuously update Xiaohongshu, WeChat, Toutiao, Zhihu, Baijiahao, CSDN, and other accounts." },
        { question: "How is KeduckAI different from a generic self-media tool?", answer: "KeduckAI focuses more on AI content quality and platform-specific content scenarios, while also providing publishing and content matrix operation capabilities instead of only account management or content copying." },
      ],
    },
  },
  {
    slug: "matrix-automation",
    title: {
      "zh-CN": "矩阵自动化运营工具 - 自媒体矩阵内容生成与发布 | KeduckAI",
      en: "Matrix Automation Tool for Social Media Content Operations | KeduckAI",
    },
    description: {
      "zh-CN": "KeduckAI 是矩阵自动化运营工具，支持多平台内容生成、对话发布、手动发布、定时自动发布和发布记录追踪。",
      en: "KeduckAI is a matrix automation tool for multi-platform content generation, chat publishing, manual publishing, scheduled auto-publishing, and publishing record tracking.",
    },
    keywords: {
      "zh-CN": ["矩阵自动化运营工具", "自媒体矩阵运营", "多平台自动发布工具", "定时自动发布工具", "内容矩阵运营"],
      en: ["matrix automation tool", "social media matrix operations", "multi-platform auto-publishing tool", "scheduled auto-publishing tool"],
    },
    badge: { "zh-CN": "场景专题", en: "Scenario Guide" },
    heading: { "zh-CN": "自媒体矩阵自动化运营工具", en: "Matrix Automation Tool for Social Media Operations" },
    lead: {
      "zh-CN": "当团队需要同时运营小红书、公众号、头条、知乎、百家号、CSDN 等渠道时，KeduckAI 可以减少复制、排版、切换后台和重复发布的工作量。",
      en: "When teams operate Xiaohongshu, WeChat, Toutiao, Zhihu, Baijiahao, CSDN, and other channels together, KeduckAI reduces repetitive copying, formatting, backend switching, and publishing work.",
    },
    highlightsTitle: { "zh-CN": "矩阵运营能力", en: "Matrix operation capabilities" },
    highlights: {
      "zh-CN": ["按平台分别生成内容", "对话发布、手动发布和自动发布", "定时计划适配日更、周更和栏目化内容", "发布记录查看和多平台结果追踪"],
      en: ["Generate content separately by platform", "Chat publishing, manual publishing, and auto-publishing", "Scheduled plans for daily, weekly, and recurring columns", "Publishing records and multi-platform result tracking"],
    },
    workflowTitle: { "zh-CN": "矩阵运营流程", en: "Matrix operation workflow" },
    workflow: {
      "zh-CN": ["确定平台组合和内容栏目。", "生成各平台适合的图文或文章内容。", "通过手动发布或定时自动发布执行，并查看发布记录。"],
      en: ["Define platform mix and content columns.", "Generate posts or articles tailored for each platform.", "Execute with manual publishing or scheduled auto-publishing, then review records."],
    },
    faq: {
      "zh-CN": [
        { question: "为什么叫矩阵自动化运营工具？", answer: "因为它面向多平台内容生产与发布流程，帮助团队把不同平台的内容生成、发布和记录追踪放在同一套流程里。" },
        { question: "矩阵自动化运营重点解决什么问题？", answer: "重点解决多平台内容生成、发布执行和结果追踪的重复工作，让内容团队更稳定地维护小红书、公众号、头条、知乎、百家号、CSDN 等渠道。" },
      ],
      en: [
        { question: "Why call it a matrix automation tool?", answer: "Because it supports multi-platform content production and publishing workflows, bringing generation, publishing, and record tracking into one process." },
        { question: "What problem does matrix automation solve?", answer: "It reduces repetitive work across multi-platform content generation, publishing execution, and result tracking, helping teams maintain channels such as Xiaohongshu, WeChat, Toutiao, Zhihu, Baijiahao, and CSDN more consistently." },
      ],
    },
  },
  {
    slug: "auto-publishing",
    title: {
      "zh-CN": "多平台自动发布工具 - 对话发布、手动发布与定时发布 | KeduckAI",
      en: "Multi-platform Auto-publishing Tool - Chat, Manual, and Scheduled Publishing | KeduckAI",
    },
    description: {
      "zh-CN": "KeduckAI 支持对话发布、手动发布和自动发布。可创建定时计划，让系统按时间自动生成内容并发布到对应平台账号。",
      en: "KeduckAI supports chat publishing, manual publishing, and auto-publishing. Create scheduled plans so the system generates and publishes content to selected platform accounts on time.",
    },
    keywords: {
      "zh-CN": ["多平台自动发布工具", "定时自动发布工具", "自动发布", "对话发布", "手动发布"],
      en: ["multi-platform auto-publishing tool", "scheduled auto-publishing tool", "auto-publishing", "chat publishing", "manual publishing"],
    },
    badge: { "zh-CN": "场景专题", en: "Scenario Guide" },
    heading: { "zh-CN": "多平台自动发布工具", en: "Multi-platform Auto-publishing Tool" },
    lead: {
      "zh-CN": "KeduckAI 支持三种发布方式：生成后通过对话指令发布，在文档编辑确认后手动发布，或创建定时计划让系统按时间自动生成并发布。",
      en: "KeduckAI supports three publishing methods: publish by chat command after generation, manually publish after document confirmation, or create scheduled plans that generate and publish on time.",
    },
    highlightsTitle: { "zh-CN": "发布方式", en: "Publishing methods" },
    highlights: {
      "zh-CN": ["对话发布：适合临时热点和快速发布", "手动发布：适合精修稿和人工确认", "自动发布：适合日更、周更和固定栏目", "发布记录：追踪成功、失败和进行中状态"],
      en: ["Chat publishing for fast trend-driven posts", "Manual publishing for polished drafts and human confirmation", "Auto-publishing for daily, weekly, and recurring columns", "Publishing records for success, failure, and in-progress status"],
    },
    workflowTitle: { "zh-CN": "自动发布流程", en: "Auto-publishing workflow" },
    workflow: {
      "zh-CN": ["创建定时计划，填写任务名称、提示词、发布账号和定时规则。", "系统按设定时间自动生成内容。", "内容发布到对应平台账号，并在发布记录中查看结果。"],
      en: ["Create a scheduled plan with task name, prompt, publishing account, and timing rules.", "The system generates content at the configured time.", "Content is published to selected platforms and tracked in publishing records."],
    },
    faq: {
      "zh-CN": [
        { question: "自动发布是怎么工作的？", answer: "自动发布通过定时计划执行。用户填写任务名称、提示词、发布账号和定时规则后，系统会按时间自动生成内容并发布。" },
        { question: "临时热点适合自动发布吗？", answer: "临时热点更适合对话发布；需要长期稳定更新的日更、周更和固定栏目，更适合自动发布。" },
      ],
      en: [
        { question: "How does auto-publishing work?", answer: "Auto-publishing runs through scheduled plans. After users set the task name, prompt, publishing account, and timing rules, the system generates and publishes content on time." },
        { question: "Is auto-publishing best for temporary trends?", answer: "Temporary trends are usually better for chat publishing. Daily updates, weekly updates, and recurring columns are better for auto-publishing." },
      ],
    },
  },
  {
    slug: "enterprise-content-marketing",
    title: {
      "zh-CN": "企业内容营销 AI 工具 - 品牌宣传与多平台内容运营 | KeduckAI",
      en: "Enterprise Content Marketing AI Tool for Brand and Multi-platform Operations | KeduckAI",
    },
    description: {
      "zh-CN": "KeduckAI 面向企业营销和品牌推广，支持产品介绍、品牌宣传、活动推广、客户案例、行业观点和多平台内容发布。",
      en: "KeduckAI helps enterprise marketing and brand teams create product introductions, brand content, campaigns, customer cases, industry viewpoints, and multi-platform publishing workflows.",
    },
    keywords: {
      "zh-CN": ["企业内容营销 AI 工具", "品牌推广AI工具", "企业AI写作工具", "多平台内容运营", "品牌宣传文案生成"],
      en: ["enterprise content marketing AI tool", "brand promotion AI tool", "enterprise AI writing tool", "multi-platform content operations"],
    },
    badge: { "zh-CN": "场景专题", en: "Scenario Guide" },
    heading: { "zh-CN": "企业内容营销 AI 工具", en: "Enterprise Content Marketing AI Tool" },
    lead: {
      "zh-CN": "企业营销团队可以用 KeduckAI 把产品卖点、活动信息、客户案例和行业观点转化为小红书图文、公众号文章、头条文章、知乎文章、百家号文章和 CSDN 技术内容。",
      en: "Enterprise marketing teams can use KeduckAI to turn product selling points, campaign information, customer cases, and industry viewpoints into Xiaohongshu posts, WeChat articles, Toutiao articles, Zhihu articles, Baijiahao articles, and CSDN technical content.",
    },
    highlightsTitle: { "zh-CN": "企业营销内容场景", en: "Enterprise marketing scenarios" },
    highlights: {
      "zh-CN": ["品牌宣传和产品介绍", "活动推广和客户案例", "行业观点和知识科普", "多平台内容分发与发布记录"],
      en: ["Brand promotion and product introductions", "Campaign posts and customer cases", "Industry viewpoints and educational content", "Multi-platform distribution and publishing records"],
    },
    workflowTitle: { "zh-CN": "企业内容营销流程", en: "Enterprise content workflow" },
    workflow: {
      "zh-CN": ["输入产品卖点、活动信息或客户案例。", "选择适合发布的平台内容类型。", "生成内容、确认合规信息后发布并追踪记录。"],
      en: ["Enter selling points, campaign information, or customer cases.", "Choose the right platform content type.", "Generate content, confirm compliance-sensitive details, publish, and track records."],
    },
    faq: {
      "zh-CN": [
        { question: "企业可以用 KeduckAI 做什么？", answer: "可以用于品牌宣传、产品介绍、活动推广、客户案例、行业观点输出和多平台内容运营。" },
        { question: "企业内容发布前需要注意什么？", answer: "建议检查价格、活动时间、产品功效、数据结论、品牌名、图片版权和合规表达。" },
      ],
      en: [
        { question: "What can enterprises use KeduckAI for?", answer: "Brand promotion, product introductions, campaign posts, customer cases, industry viewpoints, and multi-platform content operations." },
        { question: "What should teams review before publishing?", answer: "Review prices, campaign dates, product claims, data conclusions, brand names, image copyright, and compliance wording." },
      ],
    },
  },
];

export function getSeoPage(kind: SeoPageKind, slug: string): SeoDetailPage | undefined {
  const pages = kind === "platforms" ? platformSeoPages : scenarioSeoPages;
  return pages.find((page) => page.slug === slug);
}

export function getAllSeoPages(kind: SeoPageKind): SeoDetailPage[] {
  return kind === "platforms" ? platformSeoPages : scenarioSeoPages;
}
