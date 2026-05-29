/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "db.json");
const LOG_FILE = path.join(process.cwd(), "system.log");

// Initialize Gemini Client safely
let ai: GoogleGenAI | null = null;
const geminiApiKey = process.env.GEMINI_API_KEY;

if (geminiApiKey) {
  try {
    ai = new GoogleGenAI({
      apiKey: geminiApiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  } catch (error) {
    console.error("Failed to initialize GoogleGenAI client:", error);
  }
}

// Ensure database file exist with defaults
const DEFAULT_STAFF = [
  {
    staff_id: "staff-topics",
    staff_name: "AI 选题官 🎯",
    staff_desc: "搜集全网趋势，拆解爆款流派，挖掘读者核心痛点，源源不断地产出精准的选题包。",
    staff_status: "idle",
    sop_id: "sop-topics",
    is_custom: false,
    staff_prompt: "你是个顶尖的内容爆款选题官，熟悉公众号、小红书和短视频。根据用户的需求、行业、和对标痛点，生成多个针对性的、高吸引力的选题。每个选题需要包含【选题名称】、【选题吸引点描述】、【适合的发布平台】、【受众人群】。请用结构化的中文返回。",
    staff_ability: ["热点趋势抓取", "爆款对标分析", "痛点精研", "结构化选题包生成"],
    sort_num: 1
  },
  {
    staff_id: "staff-research",
    staff_name: "AI 研究员 🔬",
    staff_desc: "收集零散的原始文档、网页与链接，降噪清洗广告，并提炼结构化的观点/金句/论据作为创作素材包。",
    staff_status: "idle",
    sop_id: "sop-research",
    is_custom: false,
    staff_prompt: "你是专业的行研与知识素材提炼师。请洗净原始材料中的噪点、废话和广告。将其拆解为包含核心观点（1-2句）、精选案例/事实（如果有）、以及3句精湛的金句。格式要专业整洁。",
    staff_ability: ["多源原始文档过滤", "信息降噪清洗", "深度案例框架拆解", "金句/观点提炼提取"],
    sort_num: 2
  },
  {
    staff_id: "staff-copywriting",
    staff_name: "AI 内容撰写官 ✍️",
    staff_desc: "精通各大平台的流量分配逻辑和文体特征。一次创作能一键分身改编为公众号长文、小红书贴纸、小视频讲稿等5大形式。",
    staff_status: "idle",
    sop_id: "sop-copywriting",
    is_custom: false,
    staff_prompt: "你是全案内容撰写大师。能基于选题和素材编写完美文案。支持这几种版本：微信公众号（长篇，起承转合）、小红书笔记（充满情绪，小图标Emoji，极强视觉重点，带标签）、抖音口播稿（口语化，前3秒黄金钩子，段落感强）、微信朋友圈（简洁走心）、社群引流语（高互动性，引导回复）。请根据用户需求生成对应的内容。",
    staff_ability: ["公众号爆款文章", "小红书爆款笔记", "短视频爆客讲稿", "朋友圈文案", "高互动社群语"],
    sort_num: 3
  },
  {
    staff_id: "staff-sales",
    staff_name: "AI 私域销售助理 💬",
    staff_desc: "7x24小时全天候值守，依据引流、问答、成交和挽留脚本匹配关键词答复。可对咨询行为智能分级，自动建档跟进。",
    staff_status: "idle",
    sop_id: "sop-sales",
    is_custom: false,
    staff_prompt: "你是顶尖的社群及私域导购顾问。你会根据客户的提问进行分析。我们会提供：引流脚本、答疑脚本、成交脚本、客户挽留脚本。如果问题带有关键词，优先选用预设脚本。请以非常亲和且专业的口吻来答复，并自动给出此用户的意向等级(高级/中级/低级)和他的核心需求画像。",
    staff_ability: ["关键词剧本极速响应", "多口径FAQ答疑", "AI意向意愿自动研判", "客户精准自动化建档"],
    sort_num: 4
  },
  {
    staff_id: "staff-reviewer",
    staff_name: "AI 运营复盘官 📊",
    staff_desc: "聚合选题量、曝光度、粉丝转粉率及成交漏斗等全链路报表，诊断流失死角，给出可落地在SOP或Prompt的提效指南。",
    staff_status: "idle",
    sop_id: "sop-review",
    is_custom: false,
    staff_prompt: "你是顶流项目运营顾问。请给出一份针对近期生产、流量和客服转化数据的复盘分析。给出：1. 现状数据汇总；2. 痛点问题诊断（比如内容转化率低、意向漏斗损耗大）；3. 针对性的可落地行动策略，这些需要可直接用作修改SOP规则或AI提示词的建议。请返回详细的诊断文档。",
    staff_ability: ["全渠道数据智能归类", "项目增长流失沙盘诊断", "自动化复盘汇总", "反哺SOP/Prompt脚本库"],
    sort_num: 5
  }
];

const DEFAULT_SOP_TEMPLATES = [
  {
    sop_id: "sop-topics",
    sop_name: "高潜热点与痛点挖掘选题SOP 🚀",
    sop_type: "content",
    sop_content: [
      {
        step_id: "step-t1",
        step_name: "全网爆款与行业热点搜集",
        execute_staff_id: "staff-topics",
        input_requirements: "输入你所处于的细分赛道（如：小红书AI副业、程序员独立开发、考研培训等）",
        output_standards: "行业最新趋势热点大盘、爆款对标合集分析报告。",
        custom_prompt: "请针对这一细分赛道，精选5个当前正在爆发的热点题材以及1个对标方向。",
        require_audit: true
      },
      {
        step_id: "step-t2",
        step_name: "目标受众刚需痛点挖掘",
        execute_staff_id: "staff-topics",
        input_requirements: "输入用户的高频提问/社群吐槽/评论区反馈",
        output_standards: "结构化的3个用户急需解决的痛点及痛点原因剖析。",
        custom_prompt: "提取评论和吐槽中的刚需，详细列举出他们的内心恐惧、希望得到的即时反馈和行动痛点。",
        require_audit: false
      },
      {
        step_id: "step-t3",
        step_name: "智能生成多维选题提案",
        execute_staff_id: "staff-topics",
        input_requirements: "综合第一步热点和第二步痛点",
        output_standards: "5个适配各大平台的爆款选题。包含：选题名、平台适配度、吸睛理由、目标受众、预期效果分。",
        custom_prompt: "综合考量热度和受众刚需，产出5个能立即撰写落地的高潜引流选题选题清单，格式美观。",
        require_audit: true
      }
    ],
    bind_staff_id: "staff-topics",
    status: true,
    create_time: new Date().toISOString()
  },
  {
    sop_id: "sop-research",
    sop_name: "原始文档多源深度清洗研究SOP 🔬",
    sop_type: "content",
    sop_content: [
      {
        step_id: "step-r1",
        step_name: "多源原始输入汇整与过滤清洗",
        execute_staff_id: "staff-research",
        input_requirements: "导入一篇长文、行业报告草案或多段零碎记录",
        output_standards: "祛除无关信息、广告干扰、冗长废话后的高纯度文本知识点大纲。",
        custom_prompt: "净化输入的文本，把口水话、冗赘词、微信联系方式或商业广告过滤掉，保留所有的事实、结论。字数精炼。",
        require_audit: false
      },
      {
        step_id: "step-r2",
        step_name: "深度案例剖析与高价值亮点提炼",
        execute_staff_id: "staff-research",
        input_requirements: "基于粗清洗后的知识亮点",
        output_standards: "输出：案例背景（Why）、落地实操方案（How）、避坑痛点（What）、核心增长逻辑（Logic）。",
        custom_prompt: "分析里面的具体实例。按背景、步骤、避坑和底层机制四个维度进行高信息浓度的专业剖析，使之成为有说服力的写作佐料。",
        require_audit: true
      },
      {
        step_id: "step-r3",
        step_name: "标准化创作素材金句资产包打包",
        execute_staff_id: "staff-research",
        input_requirements: "清洗与解构的全部知识数据",
        output_standards: "一份极具爆发力的内容素材包：包含3个论点、3个故事论据、5个金句（包含对策型、反思型、警示型句式）。可一键归档入库。",
        custom_prompt: "请基于当前分析成果，总结撰写出能瞬间击中对自媒体读者痛点的5条干货金句，和3个故事化的论据支撑素材，使文案更加丰满。",
        require_audit: true
      }
    ],
    bind_staff_id: "staff-research",
    status: true,
    create_time: new Date().toISOString()
  },
  {
    sop_id: "sop-copywriting",
    sop_name: "极客级多平台一键内容分身SOP ✍️",
    sop_type: "content",
    sop_content: [
      {
        step_id: "step-c1",
        step_name: "多平台标题与钩子深度打磨",
        execute_staff_id: "staff-copywriting",
        input_requirements: "提供已定选题、核心主张和素材包",
        output_standards: "针对小红书、公众号、微头条分别打磨的爆款备选标题，每个平台提供3组，并附带第一句话（吸引金句）。",
        custom_prompt: "针对公众号采用知乎/讲理风、小红书采用震惊/种草/数字流、短视频口播采用3秒黄金钩子，请各设计3组爆热标题及第一句关键破局词。",
        require_audit: true
      },
      {
        step_id: "step-c2",
        step_name: "母本正文结构化推演编写",
        execute_staff_id: "staff-copywriting",
        input_requirements: "确认的备选标题及方向",
        output_standards: "一篇逻辑严密、情感饱满、结构完整的母本初稿。字数1000字左右。",
        custom_prompt: "把选题和金句融合。写出一篇干货拉满、起承转合顺畅的极高阶文章。前有情绪痛点，中有方法实例，后有金句呼唤，提供充足的转发和收藏理由。",
        require_audit: false
      },
      {
        step_id: "step-c3",
        step_name: "一键生产公众号/小红书/朋友圈/话术",
        execute_staff_id: "staff-copywriting",
        input_requirements: "审核通过的母文正文",
        output_standards: "输出五套独立完整的最终文案（公众号长文、小红书高排版笔记、短视频急切口播稿、情感走心朋友圈文、高反思社群文）。",
        custom_prompt: "请按特定规则将母本深度转化：小红书要插满Emoji标签并分段极其清晰；口播稿要多用口语化语气助词、提示呼吸气口；朋友圈一语中的、温暖深刻；社群文具有互动挑衅感。完成五个版本的裂变输出。",
        require_audit: true
      }
    ],
    bind_staff_id: "staff-copywriting",
    status: true,
    create_time: new Date().toISOString()
  },
  {
    sop_id: "sop-sales",
    sop_name: "私域金牌导购智能接单SOP 💬",
    sop_type: "customer",
    sop_content: [
      {
        step_id: "step-s1",
        step_name: "访客意图解析与关键词深度核对",
        execute_staff_id: "staff-sales",
        input_requirements: "接入的客户咨询内容 / 提问段落",
        output_standards: "识别出的客户核心痛点、搜索脚本匹配状态、本次咨询的关键词切片。",
        custom_prompt: "对用户的提问进行语意分类。识别出他想要：买东西、了解功能、对服务不满意，或者是单纯的疑问。提取最精准的关键词。",
        require_audit: false
      },
      {
        step_id: "step-s2",
        step_name: "金牌话术库精准套用与AI亲切生成答复",
        execute_staff_id: "staff-sales",
        input_requirements: "核对后的意图及数据库匹配出的话术模板",
        output_standards: "一段超级和煦、干货十足、带出下一步互动、完美融入预先设定台本的高转化回复文案。",
        custom_prompt: "结合我们预置的话术，亲切委婉回复客户。在解答问题之余，务必抛出一个能引发其后续回复的兴趣诱饵问题。多用波浪号、表情，让人感觉是真实的、热心的活泼小助手在服务。",
        require_audit: false
      },
      {
        step_id: "step-s3",
        step_name: "意向分级建档及转人工接管提醒",
        execute_staff_id: "staff-sales",
        input_requirements: "答复后的情绪与行为反馈",
        output_standards: "建立详细的 lead 客户档案（意向评级、痛点记录、已回复情况），如果满足意向强，跳出红色重点接管警告。",
        custom_prompt: "根据用户的提问广度和深度，判断转化希望。将其标定为高级（明确付费意愿/想要链接）、中级（对价值认同但在犹豫）、低级（单纯白嫖、路过）。记录该用户的商业画像、他最在意的痛点，生成CRM档案。",
        require_audit: true
      }
    ],
    bind_staff_id: "staff-sales",
    status: true,
    create_time: new Date().toISOString()
  },
  {
    sop_id: "sop-review",
    sop_name: "精细化数据洞察与诊断周复盘SOP 📊",
    sop_type: "review",
    sop_content: [
      {
        step_id: "step-re1",
        step_name: "全业务链路多端运营数据自动归拢",
        execute_staff_id: "staff-reviewer",
        input_requirements: "最近一周的发布数量、各平台阅读/点赞、新增微信群与私域咨询量",
        output_standards: "全渠道精细化数据透视指标表（包括：内容产出矩阵、转化归因大盘、总曝光数、漏斗损耗比率）。",
        custom_prompt: "将粗糙的数据提炼为一套专业的指标。计算从内容浏览，到素材下载，到微信咨询，再到下单购课的完整商业转化率大盘。",
        require_audit: false
      },
      {
        step_id: "step-re2",
        step_name: "高阶运营诊断与漏斗死穴诊断",
        execute_staff_id: "staff-reviewer",
        input_requirements: "自动归拢后的数据大盘指标",
        output_standards: "一份严谨深刻的项目透视诊断报告。剖析为什么高阅读没低引流，为什么高咨询没转化，指出目前的流失最严重的堵点。",
        custom_prompt: "深挖数据背后的根源。用专业的数据漏斗眼光，分析是标题党了、干货太干了不引发购买、还是私域客服不够热情话术生硬？精细诊断出一个黑天鹅堵点。",
        require_audit: true
      },
      {
        step_id: "step-re3",
        step_name: "反哺级SOP与Prompt修改迭代方案建议",
        execute_staff_id: "staff-reviewer",
        input_requirements: "流失死穴剖析",
        output_standards: "针对痛点，写出具体针对【选题官】、【内容官】或【销售官】的优化方案。甚至给出推荐调整的具体Prompt片段。",
        custom_prompt: "结合刚才盘出的死穴，设计一份具体的解决方案。如果是销售转化率低，建议升级哪个话术、增加何种钩子；如果是选题不行，建议选题官在Prompt里加入什么选拔条件，格式清晰，一键可复制。",
        require_audit: true
      }
    ],
    bind_staff_id: "staff-reviewer",
    status: true,
    create_time: new Date().toISOString()
  }
];

const DEFAULT_SPEECH = [
  {
    speech_id: "sp-1",
    speech_type: "attraction",
    keyword: "副业",
    speech_content: "哇塞！您对AI副业很感兴趣对吗？我是小助！目前我们最火爆的项目是《一人公司AI效率实操班》，零代码背景的学员很多都在第二周做出了自己的AI小工具！我先发您一份《2026最新AI高效副业精选15个行业指南.pdf》，您收一下噢！",
    status: true
  },
  {
    speech_id: "sp-2",
    speech_type: "faq",
    keyword: "价格",
    speech_content: "老师！我们目前的训练营是单人特惠价 199 元（含终身社群、5大AI员工专属高阶Prompt、1对1导师辅导）。由于快招满啦，今晚24点将恢复原价 299 元噢！现在报名不仅锁定最低价，还会额外赠送一套高价值的运营主脑全景模板，非常划算！",
    status: true
  },
  {
    speech_id: "sp-3",
    speech_type: "conversion",
    keyword: "报名",
    speech_content: "太棒啦！欢迎您加入我们AI高能运营团队！[拥抱] 报名的流程极其便利：请长按扫描下方群助手的收款账单（微信/支付宝均可），付款后在群里发一下成功截图。我将在1分钟内把您的学员账号、社群验证和1对1大礼包打包发您！让我们一起把AI赋能落到实处！",
    status: true
  },
  {
    speech_id: "sp-4",
    speech_type: "retention",
    keyword: "犹豫",
    speech_content: "没关系的呀亲亲，您可以先考虑考虑~ 买课不仅是买资料，更买的是一整套陪伴交付和极其实用的方法。如果您还在犹豫能不能学会，您可以先看看我们群里非技术专业姐姐的实操笔记。如果您需要的话，我也能把昨天大神的直播回放先发您白嫖一部分噢！想看吗？",
    status: true
  }
];

const DEFAULT_CUSTOMERS = [
  {
    customer_id: "cust-1",
    nickname: "独立开发者-阿强",
    intent_level: "high",
    chat_record: [
      { sender: "client", text: "你们的产品包含AI虚拟员工功能吗？我现在一个人写代码，运营全靠自己，感觉精疲力竭。", timestamp: new Date(Date.now() - 36000000).toISOString() },
      { sender: "ai", text: "亲爱的阿强！完全包含！我们系统正是为了解决您这样的一人公司痛点而设计的！系统默认自带AI选题官、AI研究员、AI撰写官、AI销售和AI复盘官5大员工，他们就像你的真实雇员。我可以先给您看一个《程序员AI极客全包运营SOP》，能彻底解放你的日常运营，哪怕你睡觉AI也在线！", timestamp: new Date(Date.now() - 35900000).toISOString() },
      { sender: "client", text: "听起来挺切合我的需要，那这个价格和训练营报名是怎么报的？", timestamp: new Date(Date.now() - 35800000).toISOString() }
    ],
    create_time: new Date(Date.now() - 36000000).toISOString(),
    remarks: "想让AI帮他推广独立开发的高效番茄钟工具，付费意愿强烈。"
  },
  {
    customer_id: "cust-2",
    nickname: "自媒体博主-Lily姐",
    intent_level: "medium",
    chat_record: [
      { sender: "client", text: "我想做考研英语方面的选题。你们有相关的SOP方案吗？每天构思文案耗时太长了。", timestamp: new Date(Date.now() - 72000000).toISOString() },
      { sender: "ai", text: "Lily姐下午好！很高兴能在私域服务您！关于考研英语等垂直教育赛道，我们配备了爆款素材研究和多平台分身SOP。我们的【AI内容撰写官】能将你零碎的题目或者讲义一键改编成小红书、朋友圈、抖音讲稿，排版自带漂亮表情。省出的时间让您更专注课程交付！", timestamp: new Date(Date.now() - 71900000).toISOString() }
    ],
    create_time: new Date(Date.now() - 72000000).toISOString(),
    remarks: "英语培训讲师，急需AI协助其日常高产小红书引流笔记。目前还觉得价格有点稍贵。"
  },
  {
    customer_id: "cust-3",
    nickname: "私域白嫖党-小张",
    intent_level: "low",
    chat_record: [
      { sender: "client", text: "有免费的AI副业资料包吗？先发我一份看看。", timestamp: new Date(Date.now() - 108000000).toISOString() },
      { sender: "ai", text: "小张你好呀！早就为你准备好啦！[闪烁] 这份《2026最新AI高效副业精选15个行业指南》是免费的！您收好！有什么疑问随时圈我哦！", timestamp: new Date(Date.now() - 107900000).toISOString() }
    ],
    create_time: new Date(Date.now() - 108000000).toISOString(),
    remarks: "大学生，想要各种包研究，回复比较简单，意向极低。"
  }
];

const DEFAULT_CONTENTS = [
  {
    content_id: "cont-1",
    task_id: "task-demo",
    title: "1个人如何用AI打造一个7x24不打烊的数字军团？",
    content_text: "你是否也是一个悲催的个人创业者？一个人写核心代码、还要一个人写公众号、编小红书、接待微商客户，甚至连运营复盘都是一个人？\n\n今天，2026年的一人公司全流程AI自动化运营方案正式公开！\n只需用标准化SOP驱动5大AI虚拟岗位，就能组成你的贴身护卫队：\n1️⃣ AI选题官负责搜刮热点、定位刚需；\n2️⃣ AI研究员洗干净原始长文、生成知识金句素材；\n3️⃣ AI撰写官分头改编为公众号/小红书/短视频口播，一式五份多平台分发；\n4️⃣ AI客服24小时轮守，用话术打通意向成交；\n5️⃣ AI复盘官自动倒推流量漏斗，生成提效周报，顺手升级Prompt教下轮工作更聪明！\n\n这就是「岗位化AI思维」，彻底告别散装工具瞎试错！想看我的一人数字军团全链路实操配置包吗？赶紧留言“数字军团”，小助理自动将详细说明包及专属Prompt打包塞你私信！",
    platform_type: "xiaohongshu",
    publish_status: "published",
    publish_time: new Date(Date.now() - 86400000).toISOString(),
    view_data: { views: 3200, likes: 231, collects: 184, comments: 45, shares: 32 },
    create_time: new Date(Date.now() - 90000000).toISOString()
  },
  {
    content_id: "cont-2",
    task_id: "task-demo",
    title: "告别焦虑！自由职业者的“数字资产沉淀”才是最大的护城河",
    content_text: "绝大多数自由职业者，每天都活在焦虑里：有项目就拼命赶工，没项目就疯狂推销自己。今天有灵感，明天绞尽脑汁找不到选题写。这种无规则、无体系的状态，随时面临崩盘。\n\n如何破局？你需要搭建一套属于你个人的“标准作业流程（SOP）库”与“素材主脑包”。利用专属AI员工将你遇到的每一个成功对标案例解剖掉，转化成可以立即复用的结构。在未来的项目里，你不是在重新造轮子，而是在组合轮子。AI干体力活、你享受决策！",
    platform_type: "wechat",
    publish_status: "published",
    publish_time: new Date(Date.now() - 172800000).toISOString(),
    view_data: { views: 1200, likes: 64, collects: 42, comments: 12, shares: 8 },
    create_time: new Date(Date.now() - 180000000).toISOString()
  }
];

const DEFAULT_MATERIALS = [
  {
    material_id: "mat-1",
    task_id: "task-initial",
    title: "一人公司自动运营模型理论",
    content: "一人公司并不是“不招聘”，而是“全部交给AI和全能自动化流转”。核心三要素是：1. 资产化SOP（所有的操作都有确定规范）；2. 岗位化AI（每个AI拥有固定的指令、职责、所限能力，不要让AI包揽全部）；3. 闭环回路（复盘必须能够反推优化Prompt/SOP，形成雪球效应）。",
    material_type: "viewpoint",
    source_url: "https://example.com/one-person-company",
    create_time: new Date(Date.now() - 93600000).toISOString()
  },
  {
    material_id: "mat-2",
    task_id: "task-initial",
    title: "实操案例：一个人两周做出50万营业额的小程序项目",
    content: "案例分析：开发者小李，开发了一款专门针对留考学生使用的背词App。他完全依靠AI选题官做留学生吐槽挖掘，用内容官一键做出20条小红书爆款视频引流。并在私域设置了【AI销售】，自动匹配考纲话术给报名的学生。最后通过【AI复盘官】总结，发现有40%的流失发生在深夜，因此优化了深夜话术的优惠券引诱，整体转化红利提升15%。",
    material_type: "case",
    create_time: new Date(Date.now() - 92600000).toISOString()
  }
];

const DEFAULT_TASKS = [
  {
    task_id: "task-preview-1",
    task_name: "『AI极客训练营』深度内容开发及私域获客闭环 🚀",
    sop_id: "sop-topics",
    staff_id: "staff-topics",
    task_status: "audit",
    current_step_index: 2, // At step 3: "智能生成多维选题提案" Waiting for Audit
    task_result: "【选题挖掘完成】：成功从高频痛点中提取了3个极高赞的细分选题。对标分析出：程序员对「副业变现」极具焦虑。已为您产出5个多平台选题包草稿，等待您的最终审核批准，即可一键流转给[AI撰写官]进行撰写！",
    logs: [
      { timestamp: new Date(Date.now() - 1800000).toISOString(), level: "info", message: "流水线任务创建成功，开始执行步骤一：[全网爆款与行业热点搜集]" },
      { timestamp: new Date(Date.now() - 1750000).toISOString(), level: "info", message: "[AI 选题官 🎯] 已调用。分析出「程序员副业」、「自由职业商业框架」两大高热关键词。" },
      { timestamp: new Date(Date.now() - 1700000).toISOString(), level: "info", message: "步骤一通过人工审核。进入步骤二：[目标受众刚需痛点挖掘]" },
      { timestamp: new Date(Date.now() - 1650000).toISOString(), level: "info", message: "[AI 选题官 🎯] 自动化分析评论区文本，提炼用户3大痛点：没时间写代码之外的事、不知道怎么卖、害怕露脸。" },
      { timestamp: new Date(Date.now() - 1600000).toISOString(), level: "info", message: "自动流转，开始执行步骤三：[智能生成多维选题提案]" },
      { timestamp: new Date(Date.now() - 1500000).toISOString(), level: "info", message: "[AI 选题官 🎯] 成功撰写出多维选题草案，触发[人工审核节点]，等待用户审查决策。" }
    ],
    create_time: new Date(Date.now() - 1800000).toISOString()
  }
];

const DEFAULT_REVIEWS = [
  {
    review_id: "rev-1",
    review_type: "weekly",
    data_summary: "本周全网内容产出：7篇，总浏览量：5,400+，点赞收藏：410+。私域AI销售接待新增访客：34人，意向度评级（高：9人，中：15人，低：10人）。已成功付款转化购课：7人，销售转化率达到：20.5%。",
    problem_analysis: "1. 微信公众号虽然干货多但转发率不高，排版略显枯燥。\n2. AI私域销售小助手在面对部分客户询问“能否便宜点”时，匹配的话术（sp-4 挽留）无法直接拉拢付费，意向客群流失较快。\n3. 周四内容曝光产生的小波动是因为突发断流，可能受到视频号限流的影响。",
    optimize_suggest: "1. 自媒体撰写官在Prompt中需要追加：『在段尾强化引导用户“点赞在看，防止迷路”的文案催化』。\n2. 销售话术需要紧急增加一组关于“折后方案、分期或限量体验版”的促单拼杀台本，匹配“便宜 / 折扣 / 降价”关键词。\n3. 在选题官SOP配置中，把热点捕获难度设置过滤，提高爆款的追风配比。",
    create_time: new Date(Date.now() - 604800000).toISOString()
  }
];

function initDatabase() {
  if (!fs.existsSync(DB_FILE)) {
    const data = {
      user: {
        user_id: "user-1",
        username: "admin-entrepreneur",
        avatar: "👶",
        create_time: new Date().toISOString(),
        update_time: new Date().toISOString()
      },
      ai_staff: DEFAULT_STAFF,
      sop_template: DEFAULT_SOP_TEMPLATES,
      task: DEFAULT_TASKS,
      content: DEFAULT_CONTENTS,
      material: DEFAULT_MATERIALS,
      speech: DEFAULT_SPEECH,
      customer: DEFAULT_CUSTOMERS,
      review_data: DEFAULT_REVIEWS,
      system_logs: [
        { id: "log-1", timestamp: new Date().toISOString(), category: "system", message: "AI员工团队工作台轻量化数据引擎初始化完毕，5大初始岗位及默认SOP已就位。" }
      ]
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
    console.log("Database initialized successfully!");
  }
}

initDatabase();

// Database Helper
function readDb() {
  try {
    const content = fs.readFileSync(DB_FILE, "utf8");
    return JSON.parse(content);
  } catch (err) {
    console.error("Error reading database:", err);
    return {};
  }
}

function writeDb(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("Error writing database:", err);
  }
}

function appendSystemLog(category: "api" | "ai" | "task" | "system", message: string, details?: string) {
  const db = readDb();
  if (!db.system_logs) db.system_logs = [];
  const log = {
    id: "log-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
    timestamp: new Date().toISOString(),
    category,
    message,
    details
  };
  db.system_logs.unshift(log);
  // Keep last 200 logs
  if (db.system_logs.length > 200) {
    db.system_logs = db.system_logs.slice(0, 200);
  }
  writeDb(db);
}

// REST Server API Routing
async function startServer() {
  const app = express();
  app.use(express.json());

  // 1. STATS WORKSPACE (首页总览数据)
  app.get("/api/stats", (req, res) => {
    try {
      const db = readDb();
      const today = new Date().toISOString().split("T")[0];
      
      const topicCount = db.task ? db.task.filter((t: any) => t.sop_id === "sop-topics").length + 5 : 5;
      const contentCount = db.content ? db.content.length : 2;
      const customerCount = db.customer ? db.customer.length : 3;
      const reviewCount = db.review_data ? db.review_data.length : 1;
      
      // Calculate Task Success Rate
      let completed = 0;
      let total = 0;
      if (db.task) {
        total = db.task.length;
        completed = db.task.filter((t: any) => t.task_status === "completed").length;
      }
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 85;

      // Count staff statuses
      const staffList = db.ai_staff || [];
      const stats = {
        topic_count: topicCount,
        content_count: contentCount,
        customer_count: customerCount,
        review_count: reviewCount,
        task_completion_rate: completionRate,
        staff_stats: {
          total: staffList.length,
          idle: staffList.filter((s: any) => s.staff_status === "idle").length,
          busy: staffList.filter((s: any) => s.staff_status === "busy").length,
          offline: staffList.filter((s: any) => s.staff_status === "offline").length,
        }
      };
      res.json(stats);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 2. VIRTUAL STAFFS ENDPOINTS (可自定义AI虚拟岗位)
  app.get("/api/staff", (req, res) => {
    try {
      const db = readDb();
      res.json(db.ai_staff || []);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/staff", (req, res) => {
    try {
      const db = readDb();
      const newStaff = {
        staff_id: "staff-" + Date.now(),
        staff_name: req.body.staff_name || "未命名自定义AI员工",
        staff_desc: req.body.staff_desc || "岗位职责说明...",
        staff_status: "idle",
        sop_id: req.body.sop_id || "",
        is_custom: true,
        staff_prompt: req.body.staff_prompt || "你是专业的AI助手...",
        staff_ability: req.body.staff_ability || ["通用文本处理"],
        sort_num: (db.ai_staff ? db.ai_staff.length : 0) + 1
      };
      db.ai_staff.push(newStaff);
      writeDb(db);
      appendSystemLog("system", `创建了自定义AI员工：${newStaff.staff_name}`);
      res.json(newStaff);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/staff/:id", (req, res) => {
    try {
      const db = readDb();
      const staffIndex = db.ai_staff.findIndex((s: any) => s.staff_id === req.params.id);
      if (staffIndex === -1) return res.status(404).json({ error: "岗位不存在" });

      const updated = {
        ...db.ai_staff[staffIndex],
        staff_name: req.body.staff_name,
        staff_desc: req.body.staff_desc,
        sop_id: req.body.sop_id,
        staff_prompt: req.body.staff_prompt,
        staff_ability: req.body.staff_ability,
        staff_status: req.body.staff_status || db.ai_staff[staffIndex].staff_status
      };
      db.ai_staff[staffIndex] = updated;
      writeDb(db);
      appendSystemLog("system", `更新了AI员工参数：${updated.staff_name}`);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/staff/:id", (req, res) => {
    try {
      const db = readDb();
      const staff = db.ai_staff.find((s: any) => s.staff_id === req.params.id);
      if (!staff) return res.status(404).json({ error: "岗位不存在" });
      if (!staff.is_custom) return res.status(400).json({ error: "默认核心系统岗位禁止删除" });

      db.ai_staff = db.ai_staff.filter((s: any) => s.staff_id !== req.params.id);
      writeDb(db);
      appendSystemLog("system", `删除了自定义AI员工：${staff.staff_name}`);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 3. SOP可视化流程引擎 ENDPOINTS
  app.get("/api/sop", (req, res) => {
    try {
      const db = readDb();
      res.json(db.sop_template || []);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/sop", (req, res) => {
    try {
      const db = readDb();
      const newSop = {
        sop_id: "sop-" + Date.now(),
        sop_name: req.body.sop_name || "自定义自动化SOP流程",
        sop_type: req.body.sop_type || "content",
        sop_content: req.body.sop_content || [],
        bind_staff_id: req.body.bind_staff_id || "",
        status: true,
        create_time: new Date().toISOString()
      };
      db.sop_template.push(newSop);
      writeDb(db);
      appendSystemLog("system", `创建了新SOP流程：${newSop.sop_name}`);
      res.json(newSop);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/sop/:id", (req, res) => {
    try {
      const db = readDb();
      const index = db.sop_template.findIndex((s: any) => s.sop_id === req.params.id);
      if (index === -1) return res.status(404).json({ error: "SOP未找到" });

      const updated = {
        ...db.sop_template[index],
        sop_name: req.body.sop_name,
        sop_type: req.body.sop_type,
        sop_content: req.body.sop_content,
        bind_staff_id: req.body.bind_staff_id,
        status: req.body.status !== undefined ? req.body.status : db.sop_template[index].status
      };
      db.sop_template[index] = updated;
      writeDb(db);
      appendSystemLog("system", `编辑并保存了SOP参数：${updated.sop_name}`);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/sop/:id", (req, res) => {
    try {
      const db = readDb();
      // Allow delete if exist
      const sop = db.sop_template.find((s: any) => s.sop_id === req.params.id);
      if (!sop) return res.status(404).json({ error: "SOP未找到" });
      
      db.sop_template = db.sop_template.filter((s: any) => s.sop_id !== req.params.id);
      writeDb(db);
      appendSystemLog("system", `删除了SOP模板：${sop.sop_name}`);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 4. TASK PIPELINE ENDPOINTS (全流程流水线和核心AI驱动)
  app.get("/api/tasks", (req, res) => {
    try {
      const db = readDb();
      res.json(db.task || []);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/tasks", (req, res) => {
    try {
      const db = readDb();
      const sop = db.sop_template.find((s: any) => s.sop_id === req.body.sop_id);
      if (!sop) return res.status(400).json({ error: "关联SOP模板无效" });

      const newTask = {
        task_id: "task-" + Date.now(),
        task_name: req.body.task_name || `${sop.sop_name}计划-任务`,
        sop_id: sop.sop_id,
        staff_id: req.body.staff_id || sop.bind_staff_id || (sop.sop_content.length ? sop.sop_content[0].execute_staff_id : ""),
        task_status: "pending",
        current_step_index: 0,
        task_result: "已新建流水线。等待激活步骤开始！",
        logs: [
          { timestamp: new Date().toISOString(), level: "info", message: `流水线任务已新建。对应步骤有${sop.sop_content.length}个。` }
        ],
        create_time: new Date().toISOString()
      };

      if (!db.task) db.task = [];
      db.task.unshift(newTask);
      writeDb(db);
      appendSystemLog("task", `创建流水线任务：${newTask.task_name}`);
      res.json(newTask);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Dynamic Trigger Step executing by Server-Side Gemini API
  app.post("/api/tasks/:id/step", async (req, res) => {
    try {
      const db = readDb();
      const taskIndex = db.task.findIndex((t: any) => t.task_id === req.params.id);
      if (taskIndex === -1) return res.status(404).json({ error: "任务不存在" });

      const task = db.task[taskIndex];
      const sop = db.sop_template.find((s: any) => s.sop_id === task.sop_id);
      if (!sop) return res.status(400).json({ error: "SOP流程模板丢失" });

      const currentStep = sop.sop_content[task.current_step_index];
      if (!currentStep) {
        task.task_status = "completed";
        task.finish_time = new Date().toISOString();
        writeDb(db);
        return res.json(task);
      }

      // Transition to RUNNING
      task.task_status = "running";
      const staff = db.ai_staff.find((s: any) => s.staff_id === currentStep.execute_staff_id) || db.ai_staff[0];
      
      // Update Staff status to busy
      const staffIndex = db.ai_staff.findIndex((s: any) => s.staff_id === staff.staff_id);
      if (staffIndex !== -1) db.ai_staff[staffIndex].staff_status = "busy";

      const timestampInput = new Date().toISOString();
      task.logs.push({
        timestamp: timestampInput,
        level: "info",
        message: `[${staff.staff_name}] 开始执行步骤 ${task.current_step_index + 1}/${sop.sop_content.length}：[${currentStep.step_name}]`
      });
      writeDb(db);

      const userInputData = req.body.input_data || "精细化自媒体创业";
      
      let aiOutput = "";
      if (!ai) {
        // Fallback if no api key
        aiOutput = `【模拟AI服务输出-环境未配置API密钥】：
针对输入：“${userInputData}”
本步骤由【${staff.staff_name}】代理。
已依照预设工作指令生成对应初稿。
输入规范：${currentStep.input_requirements}
输出：成功解析，生成适配数据结构，请批准！`;
      } else {
        try {
          const sysInstruction = `${staff.staff_prompt}\n\n当前步骤特定的工作提示指令：\n${currentStep.custom_prompt}\n输出应该严格达标级别：${currentStep.output_standards}`;
          
          appendSystemLog("ai", `调用Gemini 3.5为步骤[${currentStep.step_name}]生产分析。`);
          
          const response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: `需求与输入数据：${userInputData}\n\n请输出详细结构化的业务文档或文案包（全部用漂亮的中文排版）：`,
            config: {
              systemInstruction: sysInstruction,
              temperature: 0.7,
            },
          });
          
          aiOutput = response.text || "生成内容为空，请重新发送。";
        } catch (aiErr: any) {
          console.error("Gemini invocation failed:", aiErr);
          aiOutput = `【AI调用异常，生成兜底模板】:
对于行业痛点 “${userInputData}”，[${staff.staff_name}] 已经将其标准化分段：
1. 问题背景：资源集中度过高，单人身兼多职，精力分散；
2. 切入解法：通过模块化的SOP，降低思维转化摩擦成本，AI员工各司其职；
3. 复用行动模型：在流程引擎中建立永久的自媒体选题与客户接待话术映射关系。`;
        }
      }

      // Finish this step execution
      task.task_result = aiOutput;
      
      // Check if this material is returned, optionally create a material asset or content
      if (staff.staff_id === "staff-topics" || task.sop_id === "sop-topics") {
        // Topic官
        db.material.push({
          material_id: "mat-" + Date.now(),
          task_id: task.task_id,
          title: `选题提案 - ${userInputData.slice(0, 20)}`,
          content: aiOutput,
          material_type: "viewpoint",
          create_time: new Date().toISOString()
        });
      } else if (staff.staff_id === "staff-research" || task.sop_id === "sop-research") {
        // 研究员
        db.material.push({
          material_id: "mat-" + Date.now(),
          task_id: task.task_id,
          title: `深度素材：${userInputData.slice(0, 20)}`,
          content: aiOutput,
          material_type: "case",
          create_time: new Date().toISOString()
        });
      } else if (staff.staff_id === "staff-copywriting" || task.sop_id === "sop-copywriting") {
        // 内容撰写
        db.content.push({
          content_id: "cont-" + Date.now(),
          task_id: task.task_id,
          title: `适配发布：${userInputData.slice(0, 20)}`,
          content_text: aiOutput,
          platform_type: "xiaohongshu",
          publish_status: "draft",
          view_data: { views: 0, likes: 0, collects: 0, comments: 0, shares: 0 },
          create_time: new Date().toISOString()
        });
      } else if (staff.staff_id === "staff-reviewer") {
        // 复盘官
        db.review_data.push({
          review_id: "rev-" + Date.now(),
          review_type: "weekly",
          data_summary: `快速同步输入：${userInputData}`,
          problem_analysis: "流失死角剖析已产出。",
          optimize_suggest: aiOutput,
          create_time: new Date().toISOString()
        });
      }

      // Restore Staff status to idle
      const staffIndex2 = db.ai_staff.findIndex((s: any) => s.staff_id === staff.staff_id);
      if (staffIndex2 !== -1) db.ai_staff[staffIndex2].staff_status = "idle";

      task.logs.push({
        timestamp: new Date().toISOString(),
        level: "info",
        message: `[${staff.staff_name}] 任务步骤顺利处理完成。`
      });

      // Does it require audit?
      if (currentStep.require_audit) {
        task.task_status = "audit";
        task.logs.push({
          timestamp: new Date().toISOString(),
          level: "warning",
          message: "该步骤开启了【人工审核】，请在审核卡片中确认后，才能进入下一步流程。"
        });
      } else {
        // Auto advance
        task.current_step_index += 1;
        if (task.current_step_index >= sop.sop_content.length) {
          task.task_status = "completed";
          task.finish_time = new Date().toISOString();
          task.logs.push({
            timestamp: new Date().toISOString(),
            level: "info",
            message: "🎉 所有流程步骤已悉数执行成功，流水线运营完成！成果已汇入相应资产库中。"
          });
        } else {
          task.task_status = "pending";
        }
      }

      db.task[taskIndex] = task;
      writeDb(db);
      res.json(task);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // User manual approval gate
  app.post("/api/tasks/:id/audit", (req, res) => {
    try {
      const db = readDb();
      const taskIndex = db.task.findIndex((t: any) => t.task_id === req.params.id);
      if (taskIndex === -1) return res.status(404).json({ error: "任务不存在" });

      const task = db.task[taskIndex];
      const approved = req.body.approved !== false;
      const sop = db.sop_template.find((s: any) => s.sop_id === task.sop_id);
      
      if (!sop) return res.status(400).json({ error: "SOP模板损坏" });

      if (approved) {
        task.logs.push({
          timestamp: new Date().toISOString(),
          level: "info",
          message: `👤 用户人工审核【批准通过】。流转到下一步步骤！`
        });
        task.current_step_index += 1;
        if (task.current_step_index >= sop.sop_content.length) {
          task.task_status = "completed";
          task.finish_time = new Date().toISOString();
          task.logs.push({
            timestamp: new Date().toISOString(),
            level: "info",
            message: "🎉 所有流程步骤已悉数执行成功，流水线运营完成！成果已汇入相应资产库中。"
          });
        } else {
          task.task_status = "pending";
        }
      } else {
        task.logs.push({
          timestamp: new Date().toISOString(),
          level: "warning",
          message: `👤 用户人工审核【退回/驳回】。指示：需要微调后重新运行步骤。`
        });
        task.task_status = "pending"; // Stay at same step to repeat
      }

      db.task[taskIndex] = task;
      writeDb(db);
      res.json(task);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Stop/Terminate pipeline
  app.post("/api/tasks/:id/stop", (req, res) => {
    try {
      const db = readDb();
      const taskIndex = db.task.findIndex((t: any) => t.task_id === req.params.id);
      if (taskIndex === -1) return res.status(404).json({ error: "任务不存在" });

      const task = db.task[taskIndex];
      task.task_status = "terminated";
      task.logs.push({
        timestamp: new Date().toISOString(),
        level: "error",
        message: "🚨 用户手动强制终止了该流水线任务。"
      });
      db.task[taskIndex] = task;
      writeDb(db);
      res.json(task);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/tasks/:id", (req, res) => {
    try {
      const db = readDb();
      db.task = db.task.filter((t: any) => t.task_id !== req.params.id);
      writeDb(db);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });


  // 5. CONTENT DISTRIBUTION ENDPOINTS (多平台内容分发)
  app.get("/api/content", (req, res) => {
    try {
      const db = readDb();
      res.json(db.content || []);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/content", (req, res) => {
    try {
      const db = readDb();
      const newContent = {
        content_id: "cont-" + Date.now(),
        task_id: req.body.task_id || "task-manual",
        title: req.body.title || "手动新建草稿",
        content_text: req.body.content_text || "输入自媒体正文内容...",
        platform_type: req.body.platform_type || "wechat",
        publish_status: "draft",
        view_data: { views: 0, likes: 0, collects: 0, comments: 0, shares: 0 },
        create_time: new Date().toISOString()
      };
      db.content.push(newContent);
      writeDb(db);
      res.json(newContent);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/content/:id", (req, res) => {
    try {
      const db = readDb();
      const idx = db.content.findIndex((c: any) => c.content_id === req.params.id);
      if (idx === -1) return res.status(404).json({ error: "内容不存在" });

      const updated = {
        ...db.content[idx],
        title: req.body.title,
        content_text: req.body.content_text,
        platform_type: req.body.platform_type,
        publish_status: req.body.publish_status || db.content[idx].publish_status
      };
      db.content[idx] = updated;
      writeDb(db);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/content/:id/publish", (req, res) => {
    try {
      const db = readDb();
      const idx = db.content.findIndex((c: any) => c.content_id === req.params.id);
      if (idx === -1) return res.status(404).json({ error: "内容不存在" });

      db.content[idx].publish_status = "published";
      db.content[idx].publish_time = new Date().toISOString();
      // Mock viral stats
      db.content[idx].view_data = {
        views: Math.floor(Math.random() * 5000) + 500,
        likes: Math.floor(Math.random() * 400) + 20,
        collects: Math.floor(Math.random() * 300) + 15,
        comments: Math.floor(Math.random() * 50) + 2,
        shares: Math.floor(Math.random() * 30) + 1
      };
      writeDb(db);
      appendSystemLog("system", `多渠道一键分发成功！已成功部署至选定平台。`);
      res.json(db.content[idx]);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/content/:id", (req, res) => {
    try {
      const db = readDb();
      db.content = db.content.filter((c: any) => c.content_id !== req.params.id);
      writeDb(db);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });


  // 6. RESEARCH MATERIALS ENDPOINTS (研究素材包)
  app.get("/api/materials", (req, res) => {
    try {
      const db = readDb();
      res.json(db.material || []);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/materials", (req, res) => {
    try {
      const db = readDb();
      const newMat = {
        material_id: "mat-" + Date.now(),
        task_id: req.body.task_id || "task-manual",
        title: req.body.title || "导入素材",
        content: req.body.content || "",
        material_type: req.body.material_type || "viewpoint",
        source_url: req.body.source_url || "",
        create_time: new Date().toISOString()
      };
      db.material.push(newMat);
      writeDb(db);
      res.json(newMat);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/materials/:id", (req, res) => {
    try {
      const db = readDb();
      db.material = db.material.filter((m: any) => m.material_id !== req.params.id);
      writeDb(db);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });


  // 7. SPEECH SCRIPTS ENDPOINTS (私域话术模板)
  app.get("/api/speech", (req, res) => {
    try {
      const db = readDb();
      res.json(db.speech || []);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/speech", (req, res) => {
    try {
      const db = readDb();
      const newSpeech = {
        speech_id: "sp-" + Date.now(),
        speech_type: req.body.speech_type || "attraction",
        keyword: req.body.keyword || "关键词",
        speech_content: req.body.speech_content || "回复内容",
        status: true
      };
      db.speech.push(newSpeech);
      writeDb(db);
      res.json(newSpeech);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/speech/:id", (req, res) => {
    try {
      const db = readDb();
      const idx = db.speech.findIndex((s: any) => s.speech_id === req.params.id);
      if (idx === -1) return res.status(404).json({ error: "话术不存在" });

      const updated = {
        ...db.speech[idx],
        speech_type: req.body.speech_type,
        keyword: req.body.keyword,
        speech_content: req.body.speech_content,
        status: req.body.status !== undefined ? req.body.status : db.speech[idx].status
      };
      db.speech[idx] = updated;
      writeDb(db);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/speech/:id", (req, res) => {
    try {
      const db = readDb();
      db.speech = db.speech.filter((s: any) => s.speech_id !== req.params.id);
      writeDb(db);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });


  // 8. CUSTOMER MANAGE & VIRTUAL TELEPHONY ASSISTANT (私域客户互动与AI销售应答端)
  app.get("/api/customers", (req, res) => {
    try {
      const db = readDb();
      res.json(db.customer || []);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/customers", (req, res) => {
    try {
      const db = readDb();
      const newLead = {
        customer_id: "cust-" + Date.now(),
        nickname: req.body.nickname || "访客小仙女",
        intent_level: req.body.intent_level || "low",
        chat_record: req.body.chat_record || [],
        create_time: new Date().toISOString(),
        remarks: req.body.remarks || ""
      };
      db.customer.unshift(newLead);
      writeDb(db);
      appendSystemLog("system", `生成了新私域客户档案：${newLead.nickname}`);
      res.json(newLead);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/customers/:id", (req, res) => {
    try {
      const db = readDb();
      const idx = db.customer.findIndex((c: any) => c.customer_id === req.params.id);
      if (idx === -1) return res.status(404).json({ error: "客户未找到" });

      db.customer[idx].nickname = req.body.nickname || db.customer[idx].nickname;
      db.customer[idx].intent_level = req.body.intent_level || db.customer[idx].intent_level;
      db.customer[idx].remarks = req.body.remarks !== undefined ? req.body.remarks : db.customer[idx].remarks;
      writeDb(db);
      res.json(db.customer[idx]);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Post chat query to AI sales assistant - real intelligence
  app.post("/api/customers/:id/chat", async (req, res) => {
    try {
      const db = readDb();
      const idx = db.customer.findIndex((c: any) => c.customer_id === req.params.id);
      if (idx === -1) return res.status(404).json({ error: "客户档案未找到" });

      const customer = db.customer[idx];
      const messageText = req.body.text || "";
      
      // Append user's chat message
      customer.chat_record.push({
        sender: "client",
        text: messageText,
        timestamp: new Date().toISOString()
      });

      // Intent screening - Check keywords first
      const matchedScript = db.speech.find(
        (s: any) => s.status && messageText.toLowerCase().includes(s.keyword.toLowerCase())
      );

      let aiReply = "";
      let automaticLevelMatch = customer.intent_level;

      if (matchedScript) {
        // High matching keyword
        aiReply = matchedScript.speech_content;
        appendSystemLog("api", `匹配到金牌话术脚本关键字 [${matchedScript.keyword}]，启动自动极速套答。`);
        
        // Increase intent levels optionally
        if (matchedScript.speech_type === "conversion") {
          automaticLevelMatch = "high";
        } else if (matchedScript.speech_type === "faq") {
          automaticLevelMatch = "medium";
        }
      } else if (ai) {
        // Run smart Gemini sales brain
        try {
          const sysPrompt = `你是一个顶尖的微信私域销售顾问，亲切周到有礼貌，名字叫运营姬。请根据客户本次的提问：“${messageText}”进行解答。你手里拥有的金牌话术体系有：
${JSON.stringify(db.speech, null, 2)}
如果觉得某条合适，请融入回答。确保语言甜美活泼、多加 Emoji、段尾抛出下一步互动，让人觉得不是死板的自动回复。
重要：你的回复必须带有一个JSON段落或以“===IMG===”作为界限，用中文答复正文。`;
          
          const response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: `客户聊天记录概要：${JSON.stringify(customer.chat_record.slice(-4), null, 2)}\n\n最新回复内容是：`,
            config: {
              systemInstruction: sysPrompt,
              temperature: 0.8
            }
          });
          aiReply = response.text || "亲亲在的呢，今天有什么想辅导了解的AI副业指南噢～";
        } catch (aiErr) {
          aiReply = "收到啦，您的困扰我已经转交给人工主脑啦！[加油] 为了更快帮到您，如果您想了解AI核心训练营，可以回复‘价格’；想要自媒体爆款选题脚本，可直接在此留言您的主营赛道哈！";
        }
      } else {
        // Fallback mock chatbot
        aiReply = "亲亲收到了噢！运营小助手已经锁定您的需求！如果是关涉AI商业部署或买课报名，可以说“副业”或“价格”获取对应资料；如正在搭建自主团队，请回复核心想法~";
      }

      // Check intent rating based on message keywords automatically
      if (messageText.includes("价格") || messageText.includes("多少钱") || messageText.includes("购买") || messageText.includes("报名") || messageText.includes("付款")) {
        automaticLevelMatch = "high";
      } else if (messageText.includes("干货") || messageText.includes("怎么用") || messageText.includes("流程") || messageText.includes("SOP")) {
        if (automaticLevelMatch !== "high") automaticLevelMatch = "medium";
      }

      // Append AI reply
      customer.chat_record.push({
        sender: "ai",
        text: aiReply,
        timestamp: new Date().toISOString()
      });

      customer.intent_level = automaticLevelMatch;
      db.customer[idx] = customer;
      writeDb(db);

      appendSystemLog("system", `AI销售助理接待了[${customer.nickname}]，评估其意向度：[${customer.intent_level}]`);
      res.json(customer);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/customers/:id", (req, res) => {
    try {
      const db = readDb();
      db.customer = db.customer.filter((c: any) => c.customer_id !== req.params.id);
      writeDb(db);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });


  // 9. OPERATIONAL REVIEW ENDPOINTS (智能化复盘器)
  app.get("/api/reviews", (req, res) => {
    try {
      const db = readDb();
      res.json(db.review_data || []);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Call server-side Gemini to write a beautiful weekly review automatically!
  app.post("/api/reviews/generate", async (req, res) => {
    try {
      const db = readDb();
      const rType = req.body.review_type || "weekly";
      
      const viewsSum = db.content ? db.content.reduce((sum: number, c: any) => sum + (c.view_data?.views || 0), 0) + 1200 : 5400;
      const customersTotal = db.customer ? db.customer.length : 3;
      const tasksTotal = db.task ? db.task.length : 1;
      
      let generatedReview = "";

      if (!ai) {
        generatedReview = `【多端模拟复盘报告】：
复盘粒度：${rType === "daily" ? "日报" : rType === "weekly" ? "周报" : "月报"}
数据总揽：内容总流引客 ${viewsSum}。注册客服获客客数 ${customersTotal} 组，运行流水线 ${tasksTotal}。
关键流损：缺乏爆款吸睛标题，用户对高单价成交略有退缩。
迭代对策：
1. 选题官：Prompt应植入「知乎百万赞反常识框架」提拉初层点击率；
2. 内容员工：公众号正文打透焦虑，尾部放二维码承接；
3. 销售助理：配置5折体验券抵消犹豫期摩擦。`;
      } else {
        try {
          const sysInstruction = "你是个极为敏锐且擅长增长黑客的电商及内容复盘分析官。请结合给出的运营统计指标写一份深度的中文复盘分析，包含：1. 数据指标剖析；2. 链路漏斗堵点诊断（具体分析是由于话题过时还是话术过于功利导致的摩擦流失）；3. 对岗位Prompt或SOP进行修改的具条建议。";
          
          appendSystemLog("ai", `调用Gemini为团队进行深度[${rType}]复盘运营诊断。`);

          const response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: `本期汇总指标：
- 多平台总触达流量：${viewsSum}
- 积累建立 lead 意向客户档案：${customersTotal} 组
- 流水线引擎执行轮次：${tasksTotal}
- 团队现任常设岗位：${JSON.stringify(db.ai_staff.map((s:any)=>s.staff_name), null, 2)}

请深度生成报告：`,
            config: {
              systemInstruction: sysInstruction,
              temperature: 0.8
            }
          });
          generatedReview = response.text || "未能生成，请重新提交。";
        } catch (aiErr: any) {
          generatedReview = `【AI复盘报告】本期总浏览量达到 ${viewsSum}，但客户高意向层级转换存在堵点。请即时优化私域答复的促单利益设定。`;
        }
      }

      const newReview = {
        review_id: "rev-" + Date.now(),
        review_type: rType,
        data_summary: `多渠道触达总量：${viewsSum}，CRM有效建档：${customersTotal}。`,
        problem_analysis: "公众号完读率尚需提振。私域白嫖意向用户过多，缺乏过滤漏斗机制。",
        optimize_suggest: generatedReview,
        create_time: new Date().toISOString()
      };

      db.review_data.unshift(newReview);
      writeDb(db);
      appendSystemLog("system", `复盘大师生成了新的[${rType === "daily" ? "日" : rType === "weekly" ? "周" : "月"}]诊断报告。`);
      res.json(newReview);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/reviews/:id", (req, res) => {
    try {
      const db = readDb();
      db.review_data = db.review_data.filter((r: any) => r.review_id !== req.params.id);
      writeDb(db);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });


  // 10. SYSTEM LOGS ENDPOINTS
  app.get("/api/logs", (req, res) => {
    try {
      const db = readDb();
      res.json(db.system_logs || []);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // SYSTEM RESET API
  app.post("/api/system/reset", (req, res) => {
    try {
      if (fs.existsSync(DB_FILE)) {
        fs.unlinkSync(DB_FILE);
      }
      initDatabase();
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Serve static dist in production, use Vite middleware in dev
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // Support React/Vite client-side router
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AI-Employee-Workspace Server running on http://0.0.0.0:${PORT}`);
    console.log(`Loaded Gemini API Key state: ${geminiApiKey ? "CONFIGURED" : "MISSING"}`);
  });
}

startServer().catch((error) => {
  console.error("Server startup crashed:", error);
});
