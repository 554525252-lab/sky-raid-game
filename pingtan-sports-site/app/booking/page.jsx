'use client';

import { useState } from 'react';
import Nav from '@/components/Nav';
import { supabase } from '@/lib/supabase';

export default function BookingPage() {
  const [form, setForm] = useState({ parent_name:'', phone:'', wechat:'', child_age:'', child_gender:'男生', training_goal:'提升体能', address_area:'', preferred_time:'', notes:'' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const update = (k,v) => setForm(prev => ({...prev, [k]:v}));
  async function submit(e) {
    e.preventDefault(); setMessage(''); setError('');
    if (!form.parent_name || !form.phone) { setError('请至少填写家长姓名和电话。'); return; }
    setSaving(true);
    const { error } = await supabase.from('bookings').insert([form]);
    setSaving(false);
    if (error) { setError('提交失败：' + error.message); return; }
    setMessage('预约提交成功。我们会尽快联系你确认时间。');
    setForm({ parent_name:'', phone:'', wechat:'', child_age:'', child_gender:'男生', training_goal:'提升体能', address_area:'', preferred_time:'', notes:'' });
  }
  return <><Nav /><section className="section"><div className="container grid two"><div><span className="kicker">Booking</span><h2>预约上门训练</h2><p className="sub">填写孩子情况后，后台会收到预约信息。你可以在手机后台查看客户、修改状态和跟进。</p><div className="card"><h3>建议填写清楚</h3><p>孩子是否偏胖、容易生气、不爱运动、协调性差、是否备考中考体育，这些会影响课程安排。</p></div></div><div className="card"><form className="form" onSubmit={submit}><div className="form-row"><label>家长姓名<input className="input" value={form.parent_name} onChange={e=>update('parent_name',e.target.value)} placeholder="例如：陈先生" /></label><label>联系电话<input className="input" value={form.phone} onChange={e=>update('phone',e.target.value)} placeholder="手机号" /></label></div><div className="form-row"><label>微信号<input className="input" value={form.wechat} onChange={e=>update('wechat',e.target.value)} placeholder="可选" /></label><label>孩子年龄<input className="input" value={form.child_age} onChange={e=>update('child_age',e.target.value)} placeholder="例如：9岁" /></label></div><div className="form-row"><label>孩子性别<select className="select" value={form.child_gender} onChange={e=>update('child_gender',e.target.value)}><option>男生</option><option>女生</option></select></label><label>训练目标<select className="select" value={form.training_goal} onChange={e=>update('training_goal',e.target.value)}><option>提升体能</option><option>减脂控重</option><option>提升协调性</option><option>提升专注力</option><option>中考体育</option><option>篮球/足球体能</option></select></label></div><label>服务区域<input className="input" value={form.address_area} onChange={e=>update('address_area',e.target.value)} placeholder="例如：平潭世界城附近" /></label><label>希望上课时间<input className="input" value={form.preferred_time} onChange={e=>update('preferred_time',e.target.value)} placeholder="例如：周六下午、工作日晚上" /></label><label>补充说明<textarea className="textarea" value={form.notes} onChange={e=>update('notes',e.target.value)} placeholder="孩子运动基础、性格、家长需求等" /></label><button className="btn primary full" disabled={saving}>{saving ? '提交中...' : '提交预约'}</button>{message && <div className="notice">{message}</div>}{error && <div className="notice error">{error}</div>}</form></div></div></section></>;
}
