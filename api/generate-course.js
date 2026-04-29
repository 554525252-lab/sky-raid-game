export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: '服务器没有配置 DEEPSEEK_API_KEY' });
    }

    const { age, gender, grade, body, goal, level, notes } = req.body || {};
    const safe = (v) => String(v || '').slice(0, 500);

    const prompt = `请生成一份上门儿童体育 60 分钟课程方案。\n\n学生信息：\n年龄：${safe(age)}\n性别：${safe(gender)}\n年级：${safe(grade)}\n体能情况：${safe(body)}\n训练目标：${safe(goal)}\n课程强度：${safe(level)}\n家长反馈：${safe(notes)}\n\n要求：\n1. 输出中文。\n2. 结构清晰，适合直接发给家长或教练使用。\n3. 训练内容简单、高效、安全。\n4. 包含热身、主训练、体能循环、放松、注意事项、给家长的话术。\n5. 如果孩子容易生气、不坚持、疑似感统问题，要降低刺激，增加可完成的小目标。\n6. 不要夸张宣传，不要医学诊断。`;

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: '你是一名儿童体能训练课程设计助手，擅长为上门体育教练生成安全、清晰、可执行的一小时课程。',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.5,
        max_tokens: 1800,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data?.error?.message || '模型接口调用失败' });
    }

    return res.status(200).json({ text: data.choices?.[0]?.message?.content || '没有生成内容' });
  } catch (err) {
    return res.status(500).json({ error: err?.message || '服务器错误' });
  }
}
