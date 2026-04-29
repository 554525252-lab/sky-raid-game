import Link from 'next/link';
import Nav from '@/components/Nav';

const plans = [
  ['体验课', '¥99', '首次了解孩子状态，适合先看效果。', ['60分钟体验', '基础体能评估', '课后训练建议']],
  ['单次私教', '¥199起', '适合临时补课、阶段训练或固定训练前试课。', ['一对一上门', '按目标训练', '课后反馈']],
  ['月度训练', '咨询', '适合需要持续改变体能、体重或考试成绩。', ['阶段计划', '训练记录', '每月复盘']]
];

export default function PricingPage() {
  return <><Nav /><section className="section"><div className="container"><div className="section-head"><div><span className="kicker">Pricing</span><h2>价格套餐</h2><p className="sub">正式价格会根据距离、年龄、训练目标和课时包调整。先预约体验最稳。</p></div></div><div className="grid three">{plans.map(([name,price,desc,points])=><div className="card" key={name}><h3>{name}</h3><div className="price">{price}</div><p>{desc}</p><div className="tags">{points.map(p=><span className="tag" key={p}>{p}</span>)}</div><div style={{marginTop:24}}><Link className="btn primary full" href="/booking">预约咨询</Link></div></div>)}</div></div></section></>;
}
