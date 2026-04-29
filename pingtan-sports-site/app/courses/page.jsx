'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Nav from '@/components/Nav';
import { supabase } from '@/lib/supabase';

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCourses() {
      const { data, error } = await supabase.from('courses').select('*').eq('is_active', true).order('sort_order', { ascending: true });
      if (!error) setCourses(data || []);
      setLoading(false);
    }
    loadCourses();
  }, []);

  return (
    <>
      <Nav />
      <section className="section"><div className="container"><div className="section-head"><div><span className="kicker">Courses</span><h2>课程体系</h2><p className="sub">课程数据来自 Supabase，后续可以在后台新增、隐藏或删除。</p></div><Link href="/booking" className="btn primary">预约体验</Link></div>{loading ? <div className="card">课程加载中...</div> : <div className="grid three">{courses.map(course => <div className="card" key={course.id}><span className="kicker">{course.subtitle || course.target_group}</span><h3>{course.title}</h3><p>{course.description}</p><div className="price">¥{course.price || '咨询'}</div><p>{course.duration} · {course.target_group}</p><div className="tags">{(course.features || []).map(f => <span className="tag" key={f}>{f}</span>)}</div></div>)}</div>}</div></section>
    </>
  );
}
