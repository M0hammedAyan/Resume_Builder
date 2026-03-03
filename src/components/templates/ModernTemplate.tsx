import { Profile } from '../../types'

interface ModernTemplateProps {
  profile: Profile
  name?: string
  email?: string
  phone?: string
}

function ModernTemplate({ profile, name = 'Your Name', email, phone }: ModernTemplateProps) {
  return (
    <div className="bg-white flex max-w-4xl mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="w-1/3 bg-gray-900 text-white p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">{name}</h1>
          <div className="text-sm text-gray-300 space-y-1">
            {email && <p>{email}</p>}
            {phone && <p>{phone}</p>}
          </div>
        </div>

        {profile.skills.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-bold mb-3 text-blue-400">SKILLS</h2>
            <div className="space-y-2">
              {profile.skills.map((item, idx) => (
                <div key={idx} className="text-sm">{item.title}</div>
              ))}
            </div>
          </section>
        )}

        {profile.achievements.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-bold mb-3 text-blue-400">ACHIEVEMENTS</h2>
            <ul className="space-y-2 text-sm">
              {profile.achievements.map((item, idx) => (
                <li key={idx}>• {item.title}</li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <div className="w-2/3 p-8">
        {profile.experience.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">EXPERIENCE</h2>
            {profile.experience.map((item, idx) => (
              <div key={idx} className="mb-6">
                <h3 className="font-bold text-gray-900 text-lg">{item.title}</h3>
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

        {profile.education.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">EDUCATION</h2>
            {profile.education.map((item, idx) => (
              <div key={idx} className="mb-4">
                <h3 className="font-bold text-gray-900">{item.title}</h3>
                {item.description && <p className="text-sm text-gray-600">{item.description}</p>}
              </div>
            ))}
          </section>
        )}

        {profile.projects.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">PROJECTS</h2>
            {profile.projects.map((item, idx) => (
              <div key={idx} className="mb-4">
                <h3 className="font-bold text-gray-900">{item.title}</h3>
                {item.description && <p className="text-sm text-gray-700">{item.description}</p>}
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  )
}

export default ModernTemplate
