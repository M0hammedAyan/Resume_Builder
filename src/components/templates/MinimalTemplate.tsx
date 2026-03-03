import { Profile } from '../../types'

interface MinimalTemplateProps {
  profile: Profile
  name?: string
  email?: string
  phone?: string
}

function MinimalTemplate({ profile, name = 'Your Name', email, phone }: MinimalTemplateProps) {
  return (
    <div className="bg-white p-12 max-w-4xl mx-auto" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
      <div className="mb-12">
        <h1 className="text-5xl font-light text-gray-900 mb-3">{name}</h1>
        <div className="flex gap-3 text-sm text-gray-500">
          {email && <span>{email}</span>}
          {phone && <span>{phone}</span>}
        </div>
      </div>

      {profile.experience.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xs font-bold text-gray-400 tracking-widest mb-4">EXPERIENCE</h2>
          {profile.experience.map((item, idx) => (
            <div key={idx} className="mb-6">
              <h3 className="font-semibold text-gray-900 text-lg">{item.title}</h3>
              {item.description && <p className="text-sm text-gray-500 mb-2">{item.description}</p>}
              {item.bullets && item.bullets.length > 0 && (
                <ul className="space-y-1 text-sm text-gray-700">
                  {item.bullets.map((bullet, i) => (
                    <li key={i} className="pl-4 border-l-2 border-gray-200">{bullet}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {profile.education.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xs font-bold text-gray-400 tracking-widest mb-4">EDUCATION</h2>
          {profile.education.map((item, idx) => (
            <div key={idx} className="mb-4">
              <h3 className="font-semibold text-gray-900">{item.title}</h3>
              {item.description && <p className="text-sm text-gray-500">{item.description}</p>}
            </div>
          ))}
        </section>
      )}

      {profile.projects.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xs font-bold text-gray-400 tracking-widest mb-4">PROJECTS</h2>
          {profile.projects.map((item, idx) => (
            <div key={idx} className="mb-4">
              <h3 className="font-semibold text-gray-900">{item.title}</h3>
              {item.description && <p className="text-sm text-gray-700">{item.description}</p>}
            </div>
          ))}
        </section>
      )}

      <div className="grid grid-cols-2 gap-10">
        {profile.skills.length > 0 && (
          <section>
            <h2 className="text-xs font-bold text-gray-400 tracking-widest mb-4">SKILLS</h2>
            <div className="space-y-1 text-sm text-gray-700">
              {profile.skills.map((item, idx) => (
                <div key={idx}>{item.title}</div>
              ))}
            </div>
          </section>
        )}

        {profile.achievements.length > 0 && (
          <section>
            <h2 className="text-xs font-bold text-gray-400 tracking-widest mb-4">ACHIEVEMENTS</h2>
            <ul className="space-y-1 text-sm text-gray-700">
              {profile.achievements.map((item, idx) => (
                <li key={idx}>• {item.title}</li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  )
}

export default MinimalTemplate
