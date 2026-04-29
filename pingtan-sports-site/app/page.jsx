import Link from 'next/link';
import Nav from '@/components/Nav';

const services = [
  ['少儿体能提升', '针对跑跳弱、容易累、不爱运动，建立力量、耐力、协调与运动习惯。'],
  ['减重塑形训练', '控制强度与节奏，提升消耗能力、核心稳定和体态表现。'],
  ['中考体育提升', '围绕跑步、跳绳、力量、柔韧等项目做阶段化训练。'],
  ['协调与专注训练', '用平衡、节奏、反应和方向转换，提升身体控制能力。'],
  ['上门省时', '不用接送，不用抢场地，教练按约定时间到家或指定场地。'],
  ['一对一定制', '每节课根据孩子状态调整，不套模板，不强行上高强度。']
];

export default function HomePage() {
  return (
    <>
      <Nav />
      <main>
        <section className="container hero">
          <div>
            <span className="kicker">专业上门体育 · 一对一定制训练</span>
            <h1>让孩子真正动起来，也让家长看见变化。</h1>
            <p className="lead">面向少儿、青少年和成人的上门体育训练。重点解决体能弱、偏胖、不爱运动、协调性差、中考体育提升等问题，用安全、清晰、可坚持的方式做长期训练。</p>
            <div className="hero-actions">
              <Link className="btn primary" href="/booking">立即预约体验课</Link>
              <Link className="btn" href="/courses">查看课程</Link>
            </div>
            <div className="stats">
              <div className="stat"><strong>1对1</strong><span>定制课程</span></div>
              <div className="stat"><strong>60min</strong><span>标准课时</span></div>
              <div className="stat"><strong>阶段反馈</strong><span>让家长看得懂</span></div>
            </div>
          </div>
          <div className="card">
            <div className="poster"><div className="poster-badge"><b>首次体验课 ¥99</b><p>基础体能评估 + 一小时训练 + 课后建议。适合先看孩子适不适合。</p></div></div>
          </div>
        </section>
        <section id="services" className="section"><div className="container"><div className="section-head"><div><h2>训练服务</h2><p className="sub">不是简单带孩子玩，而是围绕目标做可执行训练。强度可控，动作可看，反馈清楚。</p></div><Link className="btn" href="/booking">预约咨询</Link></div><div className="grid three">{services.map(([title,text], i)=><div className="card" key={title}><div className="icon">{String(i+1).padStart(2,'0')}</div><h3>{title}</h3><p>{text}</p></div>)}</div></div></section>
        <section className="section"><div className="container grid two"><div className="card"><h2>为什么适合上门训练</h2><p>孩子刚开始不一定愿意去陌生场馆。上门训练可以降低抗拒，让教练直接观察孩子真实状态。</p><p>对于容易生气、不容易坚持、协调性较弱的孩子，我们会把训练拆成小目标，减少挫败感。</p></div><div className="card"><h2>课后会反馈什么</h2><p>每节课结束后，会给家长说明完成度、孩子表现好的动作、当前薄弱点和下节课重点。</p><p>长期训练建议按 4 周为一个阶段，先建立基础，再提高强度。</p></div></div></section>
      </main>
      <footer className="footer"><div className="container">© 2026 平潭上门体育 · 少儿体能与私教训练</div></footer>
    </>
  );
}
