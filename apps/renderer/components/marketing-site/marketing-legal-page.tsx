"use client";

type MarketingLegalPageProps = {
  locale: "zh-CN" | "en";
  type: "terms" | "privacy";
};

type Section = {
  title: string;
  paragraphs: string[];
};

const TERMS_ZH: Section[] = [
  {
    title: "1. 协议适用与接受",
    paragraphs: [
      "欢迎使用可达AI（以下简称“本服务”）。本用户协议适用于你访问官网、注册账号、使用 AI 创作、素材管理、定时计划及多平台发布等功能。",
      "当你注册、登录或继续使用本服务时，即表示你已阅读并同意本协议及相关规则。如你不同意，请停止使用本服务。",
    ],
  },
  {
    title: "2. 账号与安全",
    paragraphs: [
      "你应提供真实、准确、完整的信息并妥善保管账号、密码及登录凭证，不得出借、出租、转让账号。",
      "因你保管不善导致的账号风险、内容丢失或第三方损害，由你自行承担；你发现异常登录或安全问题时，应立即联系我们。",
    ],
  },
  {
    title: "3. 服务内容与使用规范",
    paragraphs: [
      "本服务提供 AI 对话创作、选题发散、文案生成、素材管理、定时任务及发布辅助能力。具体功能以实际上线版本为准。",
      "你承诺不得利用本服务制作、发布或传播违法违规、侵权、虚假误导、恶意攻击、侵犯隐私或违反平台规则的内容。",
      "你应确保对上传素材、输入文本及发布内容拥有合法权利，并自行承担由此产生的法律责任。",
    ],
  },
  {
    title: "4. 第三方平台接入",
    paragraphs: [
      "你可在本服务中绑定第三方平台账号以完成发布操作。你授权范围以内的操作将按你的设置执行。",
      "第三方平台接口、规则、审核机制、限流与封禁均由平台自行决定；由第三方平台原因导致的失败、延迟、限制或损失，不属于本服务违约。",
    ],
  },
  {
    title: "5. 订阅、积分与费用",
    paragraphs: [
      "部分功能需购买套餐或消耗积分。价格、权益、计费周期、有效期及优惠活动以购买页实时展示为准。",
      "除法律法规另有规定外，已消耗的服务与积分通常不支持退款。你应自行判断套餐适配性后下单。",
    ],
  },
  {
    title: "6. 知识产权",
    paragraphs: [
      "本服务的软件、界面、商标、文档与相关技术成果归我们或权利人所有，未经许可不得复制、反向工程、二次分发或商业化利用。",
      "你上传或提交的原始素材权利归你或合法权利人所有；你授予我们在提供服务所必需范围内进行存储、处理、传输与展示的授权。",
    ],
  },
  {
    title: "7. 免责声明",
    paragraphs: [
      "AI 生成内容可能存在偏差、过时或不完整，不构成任何专业建议。你应对发布前审核、事实校验与合规判断负责。",
      "在法律允许范围内，本服务对间接损失、预期收益损失、数据损失或第三方索赔不承担责任。",
    ],
  },
  {
    title: "8. 协议变更与终止",
    paragraphs: [
      "我们可能根据业务和法规更新本协议。更新后会在合理位置公示，继续使用即视为接受变更。",
      "如你严重违反本协议或相关法律法规，我们有权采取限制功能、暂停或终止服务等措施。",
    ],
  },
  {
    title: "9. 联系方式",
    paragraphs: ["如你对本协议有疑问，请联系：bd@beeize.com。"],
  },
];

const PRIVACY_ZH: Section[] = [
  {
    title: "1. 我们收集的信息",
    paragraphs: [
      "为提供服务，我们可能收集：账号信息（如邮箱/手机号）、设备与日志信息、你输入的对话内容、上传素材、任务配置、发布记录及反馈信息。",
      "在你接入第三方平台时，我们还可能处理与发布相关的授权信息与必要标识（以授权页说明为准）。",
    ],
  },
  {
    title: "2. 信息使用目的",
    paragraphs: [
      "我们使用信息用于身份验证、功能实现、生成与发布处理、服务稳定性保障、故障排查、计费结算、风险控制及客户支持。",
      "在合法合规前提下，我们可能基于去标识化或聚合数据进行统计分析，用于产品优化与体验改进。",
    ],
  },
  {
    title: "3. 信息共享与披露",
    paragraphs: [
      "我们不会出售你的个人信息。",
      "仅在以下情形共享必要信息：获得你的明确同意；为实现你要求的功能（例如向你绑定的平台发起发布请求）；依法配合监管或司法机关要求；为保护合法权益而必须披露。",
    ],
  },
  {
    title: "4. 存储与保护",
    paragraphs: [
      "我们采取合理的安全措施（如访问控制、传输保护、权限隔离等）保护信息安全。",
      "尽管如此，互联网传输并非绝对安全。你应妥善保管账号凭证，避免在不安全环境中使用本服务。",
    ],
  },
  {
    title: "5. Cookie 与类似技术",
    paragraphs: [
      "我们可能使用 Cookie 或类似技术以维持登录状态、记住语言/主题偏好并改进体验。",
      "你可在浏览器中管理 Cookie，但关闭后可能影响部分功能可用性。",
    ],
  },
  {
    title: "6. 你的权利",
    paragraphs: [
      "在适用法律范围内，你可申请访问、更正、删除个人信息，或申请注销账号。",
      "你也可以通过产品内反馈或联系邮箱提交隐私请求，我们将在合理期限内处理。",
    ],
  },
  {
    title: "7. 未成年人保护",
    paragraphs: [
      "本服务主要面向具备完全民事行为能力的用户。未成年人应在监护人同意与指导下使用。",
      "如我们发现未经监护人同意收集未成年人信息，将在核实后尽快删除相关数据。",
    ],
  },
  {
    title: "8. 政策更新",
    paragraphs: [
      "我们可能根据业务或法规要求更新本隐私政策。更新后将通过官网或产品内提示。",
      "继续使用本服务即表示你已知悉并同意更新后的隐私政策。",
    ],
  },
  {
    title: "9. 联系我们",
    paragraphs: ["如有隐私相关问题，请联系：bd@beeize.com。"],
  },
];

const TERMS_EN: Section[] = [
  {
    title: "1. Scope and Acceptance",
    paragraphs: [
      "Welcome to Keduck AI (the \"Service\"). These Terms apply to your access to our website, account registration, AI creation tools, asset management, scheduled plans, and multi-platform publishing features.",
      "By registering, signing in, or continuing to use the Service, you agree to these Terms and related rules. If you do not agree, please stop using the Service.",
    ],
  },
  {
    title: "2. Account and Security",
    paragraphs: [
      "You must provide accurate account information and keep your credentials secure. You may not lend, lease, or transfer your account.",
      "You are responsible for risks caused by your own credential mismanagement. If you notice unauthorized access, contact us immediately.",
    ],
  },
  {
    title: "3. Service Use Rules",
    paragraphs: [
      "The Service provides AI chat creation, topic ideation, drafting, asset management, scheduled tasks, and publishing assistance. Available features may change by product version.",
      "You may not use the Service to create or distribute unlawful, infringing, deceptive, abusive, privacy-violating, or platform-policy-violating content.",
      "You are responsible for ensuring you have lawful rights to all inputs, assets, and published outputs.",
    ],
  },
  {
    title: "4. Third-Party Platform Integrations",
    paragraphs: [
      "You may connect third-party platform accounts and authorize publishing actions within your configured scope.",
      "Third-party platform rules, APIs, moderation, limits, and suspensions are controlled by those platforms. We are not liable for resulting failures or restrictions caused by them.",
    ],
  },
  {
    title: "5. Plans, Credits, and Billing",
    paragraphs: [
      "Some features require paid plans or credit consumption. Pricing, entitlements, billing cycles, and promotions are shown on the purchase page in real time.",
      "Unless required by law, consumed services and credits are generally non-refundable.",
    ],
  },
  {
    title: "6. Intellectual Property",
    paragraphs: [
      "The software, UI, trademarks, documentation, and technical assets of the Service are owned by us or our licensors.",
      "You retain rights to content you lawfully provide, and grant us the minimum rights needed to store, process, transmit, and display it for service delivery.",
    ],
  },
  {
    title: "7. Disclaimer",
    paragraphs: [
      "AI outputs may be inaccurate, outdated, or incomplete and do not constitute professional advice. You are responsible for review and compliance before publication.",
      "To the extent permitted by law, we are not liable for indirect damages, lost profits, data loss, or third-party claims.",
    ],
  },
  {
    title: "8. Changes and Termination",
    paragraphs: [
      "We may update these Terms to reflect legal or product changes. Updated versions take effect upon publication.",
      "If you materially violate these Terms or applicable law, we may restrict features or suspend/terminate your access.",
    ],
  },
  {
    title: "9. Contact",
    paragraphs: ["For Terms-related questions, contact: bd@beeize.com."],
  },
];

const PRIVACY_EN: Section[] = [
  {
    title: "1. Information We Collect",
    paragraphs: [
      "We may collect account data (e.g. email/phone), device and log data, chat inputs, uploaded assets, task settings, publish records, and feedback to provide the Service.",
      "When you connect third-party platforms, we may process necessary authorization-related identifiers as described in the authorization flow.",
    ],
  },
  {
    title: "2. How We Use Information",
    paragraphs: [
      "We use data for authentication, service functionality, content generation and publishing operations, reliability, troubleshooting, billing, risk control, and support.",
      "Where lawful, we may use aggregated or de-identified data for analytics and product improvement.",
    ],
  },
  {
    title: "3. Sharing and Disclosure",
    paragraphs: [
      "We do not sell your personal information.",
      "We share only when necessary: with your consent, to fulfill requested functions (such as publishing to your connected platforms), to comply with legal obligations, or to protect legitimate rights and safety.",
    ],
  },
  {
    title: "4. Storage and Security",
    paragraphs: [
      "We use reasonable safeguards such as access controls, protected transmission, and permission isolation.",
      "No internet transmission is absolutely secure. Please keep your credentials safe and use trusted environments.",
    ],
  },
  {
    title: "5. Cookies and Similar Technologies",
    paragraphs: [
      "We may use cookies or similar technologies to maintain sessions, remember language/theme preferences, and improve user experience.",
      "You can manage cookies in your browser settings, though some features may be affected.",
    ],
  },
  {
    title: "6. Your Rights",
    paragraphs: [
      "Subject to applicable law, you may request access, correction, deletion, or account cancellation.",
      "You can submit privacy requests via in-product feedback or by email, and we will process them within a reasonable time.",
    ],
  },
  {
    title: "7. Children",
    paragraphs: [
      "The Service is primarily intended for users with full legal capacity. Minors should use it with guardian consent and supervision.",
      "If we discover unauthorized collection of a minor's information, we will remove relevant data after verification.",
    ],
  },
  {
    title: "8. Policy Updates",
    paragraphs: [
      "We may update this Privacy Policy to reflect product or legal changes. Updates will be published via website or in-product notice.",
      "Continued use of the Service after updates indicates your acceptance of the revised policy.",
    ],
  },
  {
    title: "9. Contact",
    paragraphs: ["For privacy-related requests, contact: bd@beeize.com."],
  },
];

export function MarketingLegalPage({ locale, type }: MarketingLegalPageProps) {
  const isEn = locale === "en";
  const isTerms = type === "terms";
  const title = isTerms
    ? isEn
      ? "User Agreement"
      : "用户协议"
    : isEn
      ? "Privacy Policy"
      : "隐私政策";
  const lead = isTerms
    ? isEn
      ? "Please read this agreement carefully before using the Service."
      : "请在使用本服务前，仔细阅读并理解本协议。"
    : isEn
      ? "This policy explains how we collect, use, and protect your information."
      : "本政策说明我们如何收集、使用、存储和保护你的信息。";

  const sections = isEn
    ? isTerms
      ? TERMS_EN
      : PRIVACY_EN
    : isTerms
      ? TERMS_ZH
      : PRIVACY_ZH;

  return (
    <section className="border-b border-slate-200/50 py-14 dark:border-zinc-800/80 sm:py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">{title}</h1>
        <p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-zinc-400">{lead}</p>

        <div className="mt-8 space-y-6">
          {sections.map((section) => (
            <article key={section.title} className="rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/50 sm:p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{section.title}</h2>
              <div className="mt-3 space-y-2">
                {section.paragraphs.map((p) => (
                  <p key={p} className="text-sm leading-relaxed text-slate-600 dark:text-zinc-300 sm:text-[15px]">
                    {p}
                  </p>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
