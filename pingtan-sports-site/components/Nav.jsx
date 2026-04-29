import Link from 'next/link';

export default function Nav() {
  return (
    <nav className="nav">
      <div className="container nav-inner">
        <Link href="/" className="brand"><span className="mark">体</span><span>平潭上门体育</span></Link>
        <div className="links">
          <Link href="/#services">训练服务</Link>
          <Link href="/courses">课程</Link>
          <Link href="/pricing">价格</Link>
          <Link href="/booking" className="btn primary">预约体验</Link>
        </div>
      </div>
    </nav>
  );
}
