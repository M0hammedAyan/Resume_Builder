import { Profile } from '../../types'

interface ClassicTemplateProps {
  profile: Profile
  name?: string
  email?: string
  phone?: string
}

function ClassicTemplate({ profile, name = 'Your Name', email, phone }: ClassicTemplateProps) {
  return (
    <div className="bg-white p-12 max-w-4xl mx-auto" style={{ fontFamily: 'Georgia, serif' }}>
      <div className="text-center mb-8 border-b-2 border-gray-800 pb-6">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">{name}</h1>
        <div className="flex justify-center gap-4 text-sm text-gray-600">
          {email && <span>{email}</span>}
          {phone && <span>•</span>}
          {phone && <span>{phone}</span>}
        </div>
      </div>

      {profile.education.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-3 border-b border-gray-300 pb-1">EDUCATION</h2>
          {profile.education.map((item, idx) => (
            <div key={idx} className="mb-3">
              <h3 className="font-semibold text-gray-900">{item.title}</h3>
              {item.description && <p className="text-sm text-gray-600">{item.description}</p>}
            </div>
          ))}
        </section>
      )}

      {profile.experience.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-3 border-b border-gray-300 pb-1">EXPERIENCE</h2>
          {profile.experience.map((item, idx) => (
            <div key={idx} className="mb-4">
              <h3 className="font-semibold text-gray-900">{item.title}</h3>
              {item.description && <p className="text-sm text-gray-600 mb-2">{item.description}</p>}
              {item.bullets && item.bullets.length > 0 && (
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                  {item.bullets.map((bullet, i) => (
                    <li key={i}>{bullet}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {profile.projects.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-3 border-b border-gray-300 pb-1">PROJECTS</h2>
          {profile.projects.map((item, idx) => (
            <div key={idx} className="mb-3">
              <h3 className="font-semibold text-gray-900">{item.title}</h3>
              {item.description && <p className="text-sm text-gray-700">{item.description}</p>}
            </div>
          ))}
        </section>
      )}

      {profile.skills.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-3 border-b border-gray-300 pb-1">SKILLS</h2>
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((item, idx) => (
              <span key={idx} className="text-sm text-gray-700">{item.title}{idx < profile.skills.length - 1 ? ' •' : ''}</span>
            ))}
          </div>
        </section>
      )}

      {profile.achievements.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-3 border-b border-gray-300 pb-1">ACHIEVEMENTS</h2>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            {profile.achievements.map((item, idx) => (
              <li key={idx}>{item.title}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

export default ClassicTemplate
