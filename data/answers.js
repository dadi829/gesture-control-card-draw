/**
 * 答案之卡 — 答案文案数据库
 * 50条精心编写的预言/建议内容，涵盖6大分类
 */

const ANSWERS_DATA = {
  categories: [
    { id: 'love', name: '爱情', icon: '♥', color: '#ff6b8a' },
    { id: 'career', name: '事业', icon: '◆', color: '#4ecdc4' },
    { id: 'wealth', name: '财运', icon: '♦', color: '#ffd93d' },
    { id: 'health', name: '健康', icon: '♣', color: '#6bcb77' },
    { id: 'relationship', name: '人际', icon: '♠', color: '#c792ea' },
    { id: 'decision', name: '抉择', icon: '★', color: '#f78c6c' }
  ],

  cards: [
    { id: 1, category: 'love', title: '命中注定', content: '那个人正在向你走来。保持开放的心，缘分会在最意想不到的时刻降临。宇宙早已安排好一切，你只需耐心等待。', advice: '多参加社交活动，真爱就在不远处' },
    { id: 2, category: 'love', title: '勇敢表达', content: '藏在心里的爱，永远不会被看见。现在是时候迈出那一步了——表达你的真实感受，结果或许比你想象的更美好。', advice: '写一封信或直接说出你的心声' },
    { id: 3, category: 'love', title: '给时间一点时间', content: '感情如同美酒，需要时间发酵。不要急于求成，让彼此在相处的时光中慢慢了解、自然靠近。静待花开。', advice: '享受当下的暧昧，不必急于定义关系' },
    { id: 4, category: 'love', title: '先爱自己', content: '真正的爱情始于自爱。当你学会全然接纳自己，世界便会以同样的方式回应你。先让自己完整，再迎接另一半。', advice: '花时间做让你快乐的事，你的光芒会吸引对的人' },
    { id: 5, category: 'love', title: '放下过去', content: '旧的故事不翻篇，新的篇章无法开启。有些人的出现只是为了陪你走一段路，感谢相遇，然后从容告别。', advice: '清理旧物、删除过往，为新恋情腾出空间' },
    { id: 6, category: 'love', title: '转角遇到爱', content: '爱情往往出现在你最不经意的时候。停止刻意寻找，专注于过好每一天，那个对的人会在转角处与你相遇。', advice: '保持对生活的好奇心，去尝试新事物' },
    { id: 7, category: 'love', title: '心有灵犀', content: '你们之间有一种说不清的默契。这份连接是真实的，值得你去珍惜和守护。不要被外界的声音干扰了判断。', advice: '相信你的直觉，这份感情有未来' },
    { id: 8, category: 'love', title: '学会包容', content: '没有完美的人，只有愿意为彼此改变的两个人。学会用对方的眼睛看世界，理解会化解所有的分歧。', advice: '换位思考，小事不计较，大事多沟通' },
    { id: 9, category: 'career', title: '厚积薄发', content: '现在的每一分努力都在为未来的成功铺路。你种下的种子正在土壤深处生根发芽，丰收的时刻即将来临。', advice: '坚持当前方向，三个月后见分晓' },
    { id: 10, category: 'career', title: '抓住机遇', content: '一扇新的门正在为你打开。当机会来临时，不要犹豫——哪怕它看起来超出现有的能力范围，勇敢跨出那一步。', advice: '关注最近出现的跳槽或项目机会' },
    { id: 11, category: 'career', title: '换个方向', content: '有时候停下脚步不是放弃，而是为了找到更对的路。如果你正感到迷茫，不妨尝试一个全新的领域。', advice: '探索一个你一直感兴趣但从未涉足的行业' },
    { id: 12, category: 'career', title: '沉稳应对', content: '前方的挑战不会少，但你已具备足够的能力去面对。保持冷静和专注，一步一个脚印，稳扎稳打方能致远。', advice: '制定详细的执行计划，不要被焦虑打乱节奏' },
    { id: 13, category: 'career', title: '贵人相助', content: '一位前辈或同事将在关键时刻给予你重要帮助。保持谦逊和开放的态度，你并不需要独自面对一切。', advice: '主动与行业前辈交流，不要怕开口求助' },
    { id: 14, category: 'career', title: '学习成长', content: '当前阶段最重要的不是结果，而是成长。把每一次挑战都当成学习的机会，积累的经验会比当下的回报更有价值。', advice: '报一门课程或考取一个专业证书' },
    { id: 15, category: 'career', title: '展示自己', content: '你的才华不该被埋没。主动展示你的成果和能力，让该看到的人看到。沉默的贡献往往被忽视，勇敢发声吧。', advice: '在团队会议上分享你的想法和成果' },
    { id: 16, category: 'career', title: '创业机会', content: '你心中那个创业的想法并非空想。如果你已经准备了足够长的时间，也许现在就是迈出第一步的好时机。', advice: '先从小规模试水开始，验证你的商业想法' },
    { id: 17, category: 'career', title: '专注深耕', content: '与其在多个方向中摇摆不定，不如选定一个领域深耕细作。成为专家比什么都懂一点更有价值。', advice: '选择一个你最擅长的技能，把它练到极致' },
    { id: 18, category: 'wealth', title: '开源节流', content: '财富的积累既需要开源也需要节流。审视你的支出，减少不必要的消费，同时积极寻找增加收入的途径。', advice: '记录一个月的开支，找出可优化的部分' },
    { id: 19, category: 'wealth', title: '意外之喜', content: '一笔意料之外的收入正在向你靠近。可能是奖金、退款、礼物或一笔旧账的收回。保持乐观，好事将近。', advice: '检查你的财务状况，可能有被你遗忘的钱' },
    { id: 20, category: 'wealth', title: '稳健投资', content: '高风险未必带来高回报。当前阶段更适合保守稳健的理财策略，把资金安全放在第一位，细水长流。', advice: '分散投资，不要把鸡蛋放在一个篮子里' },
    { id: 21, category: 'wealth', title: '耕耘期', content: '现在是播种的季节，不是收获的季节。继续踏实工作，你的财务状况正在逐步改善，不要羡慕别人的果实。', advice: '设定一个储蓄目标，每月固定存入' },
    { id: 22, category: 'wealth', title: '慷慨分享', content: '财富的真谛在于流动。适当地分享和给予，会让更多的能量回流到你身上。慷慨是一种智慧的投资。', advice: '在能力范围内帮助需要帮助的人' },
    { id: 23, category: 'wealth', title: '转机来临', content: '长期的经济压力即将好转。一个财务上的转机正悄然接近，可能是新的收入来源或债务的化解。', advice: '重新评估你的赚钱方式，考虑副业' },
    { id: 24, category: 'wealth', title: '谨慎决策', content: '钱袋子要捂紧一点。近期不适合进行大额投资或借贷，对任何"快速致富"的承诺保持警惕。', advice: '大额支出前先和信任的人商量' },
    { id: 25, category: 'wealth', title: '价值投资', content: '投资自己是最划算的买卖。提升技能、拓宽认知、建立人脉，这些无形资产终将转化为实实在在的回报。', advice: '把钱花在学习和成长上，它是回报率最高的投资' },
    { id: 26, category: 'health', title: '身心平衡', content: '身体和心灵都需要关注。停下来倾听身体的声音，给自己足够的休息时间。健康是一切的基础。', advice: '每天留出30分钟完全属于自己的时间' },
    { id: 27, category: 'health', title: '动起来', content: '运动是最好的良药。哪怕是每天的简单散步，也能带来身心的巨大改变。让身体动起来，能量便会流动。', advice: '从每天步行30分钟开始，不追求高强度' },
    { id: 28, category: 'health', title: '规律作息', content: '你的身体正在提醒你：该好好休息了。熬夜透支的不是时间，而是健康和未来的精力。', advice: '设定固定的睡觉时间，睡前远离手机' },
    { id: 29, category: 'health', title: '饮食调理', content: '你的身体需要更好的燃料。调整饮食结构，减少加工食品，增加新鲜蔬果的摄入，你会发现精力明显提升。', advice: '每天至少吃三种颜色的蔬果' },
    { id: 30, category: 'health', title: '心情愉悦', content: '好的情绪是最好的免疫力。做让你开心的事，见让你开心的人。快乐的时光本身就是一剂良药。', advice: '安排一次期待已久的旅行或聚会' },
    { id: 31, category: 'health', title: '及时检查', content: '把那些一直拖延的身体检查尽快安排上。防患于未然远比事后治疗轻松得多。', advice: '预约一次全面体检，不要让小问题变大' },
    { id: 32, category: 'health', title: '释放压力', content: '你承担了太多，是时候放下一些包袱了。压力如同手中的水杯，拿得越久越沉重。学会适时放下。', advice: '尝试冥想、瑜伽或任何让你放松的活动' },
    { id: 33, category: 'health', title: '向阳而生', content: '多晒太阳，多接触大自然。阳光、新鲜空气和绿色植物能为你的身心注入源源不断的能量。', advice: '周末去公园或郊外走走，远离电子屏幕' },
    { id: 34, category: 'relationship', title: '真诚待人', content: '信任是所有关系的基石。以真心换真心，你撒下的善意种子终会在最需要的时候开花结果。', advice: '对身边的人多一些真诚的关心和问候' },
    { id: 35, category: 'relationship', title: '断舍离', content: '不是所有关系都值得维系。有些人只是生命中的过客，消耗你能量的关系，该放就放，你会更轻松。', advice: '清理社交圈，远离让你感到疲惫的人' },
    { id: 36, category: 'relationship', title: '修复裂痕', content: '一段曾经亲密的关系出现了裂痕。如果你还在乎，不妨主动迈出和解的第一步。一句"你还好吗"就足够了。', advice: '发一条真诚的信息，表达你的关心' },
    { id: 37, category: 'relationship', title: '新朋友将至', content: '一个有趣的新朋友即将走进你的生活。保持开放和好奇心，你们可能会在共同的爱好或场合中相遇。', advice: '参加一个新的兴趣小组或社群活动' },
    { id: 38, category: 'relationship', title: '善于倾听', content: '有时别人需要的不是一个解决方案，而是一双愿意倾听的耳朵。学会倾听，你会收获更深厚的感情。', advice: '下次聊天试着少说多听，用心理解对方' },
    { id: 39, category: 'relationship', title: '保持界限', content: '健康的爱需要有分寸。学会在亲密和独立之间找到平衡，保留属于自己的空间和边界。', advice: '学会温和而坚定地说"不"' },
    { id: 40, category: 'relationship', title: '感恩拥有', content: '你已经拥有很多值得珍惜的人和关系。不要总是追逐新的，回头看看那些一直在你身边的人。', advice: '给一位老朋友打个电话或发条消息' },
    { id: 41, category: 'relationship', title: '化解误会', content: '最近的关系摩擦源于沟通不畅。坐下来好好谈一谈，把话说开。大多数误会都经不起一次坦诚的交流。', advice: '约对方喝杯咖啡，面对面聊一聊' },
    { id: 42, category: 'decision', title: '相信自己', content: '你的内心深处早已有了答案。不要过度分析，不要过分依赖他人的意见。相信自己，你的直觉是对的。', advice: '闭上眼睛，深呼吸，选择第一个浮现在脑海的答案' },
    { id: 43, category: 'decision', title: '时机尚早', content: '现在做出决定的时机还未成熟。有些事情需要时间自然发展，仓促的决策往往带来遗憾。', advice: '等待一周再做决定，给自己更多信息' },
    { id: 44, category: 'decision', title: '勇敢前行', content: '犹豫不决比做出错误选择更糟糕。无论你如何选择，行动本身就会带来新的机遇。不要停在原地。', advice: '写下每个选项的最坏结果，你会发现它们都没那么可怕' },
    { id: 45, category: 'decision', title: '二选一', content: '两个选择中，那个让你感到兴奋和紧张的，往往就是正确答案。舒适区之外的选项值得认真考虑。', advice: '想象五年后的自己，TA会建议你选哪个？' },
    { id: 46, category: 'decision', title: '寻求建议', content: '智者善于借力。找一个你信任且经验丰富的人聊聊你的困惑。旁观者清，他们的视角可能让你豁然开朗。', advice: '找一位在你困惑领域有经验的导师或朋友聊聊' },
    { id: 47, category: 'decision', title: '权衡利弊', content: '把你的选项和对应的得失写下来。用理性分析辅助感性判断，当利弊清晰地摆在面前时，答案会很明显。', advice: '拿出一张纸，画一个"利弊分析表"' },
    { id: 48, category: 'decision', title: '接受答案', content: '你其实已经知道该怎么做了，只是需要有人告诉你：这个决定是对的。大胆去做吧，别回头。', advice: '尊重你的内心声音，不要被外界评论干扰' },
    { id: 49, category: 'decision', title: '放弃也是选择', content: '坚持并不总是美德。有时候放手也是一种智慧，结束不属于你的，才能迎接真正属于你的。', advice: '问问自己：如果此刻放弃，你会感到释然还是遗憾？' },
    { id: 50, category: 'decision', title: '顺其自然', content: '不是所有事都需要一个明确的计划。有些美好的事情发生在我们放手的那一刻。相信过程，让事情自然发展。', advice: '把注意力从纠结中移开，去做些让你快乐的事' }
  ],

  drawCards(count = 7) {
    const shuffled = [...this.cards].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }
};

window.ANSWERS_DATA = ANSWERS_DATA;
