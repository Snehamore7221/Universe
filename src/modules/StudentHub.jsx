
import React, { useState } from 'react';
import {
  GraduationCap,
  Users,
  BookOpen,
  Calendar,
  Sparkles,
  Search,
  Clock,
  CheckCircle2,
  Circle,
  BriefcaseBusiness,
  Target,
  Send,
  ExternalLink,
  Filter,
  X,
} from 'lucide-react';

import { MODULES } from '../data/seed';
import {
  STUDENT_PROFILE,
  PLACEMENT_TASKS,
  SAMPLE_MENTORS,
  SAMPLE_ACADEMIC_RESOURCES,
} from '../data/seed';

export default function StudentHub() {
  const moduleData = MODULES.find((m) => m.id === 'student-hub');

  const [activeTab, setActiveTab] = useState('placement');
  const [tasks, setTasks] = useState(PLACEMENT_TASKS);
  const [mentorQuery, setMentorQuery] = useState('');
  const [resourceQuery, setResourceQuery] = useState('');
  const [resourceType, setResourceType] = useState('All');
  const [requestedMentors, setRequestedMentors] = useState([]);
  const [filterQuery, setFilterQuery] = useState('');

  const studyCircles = moduleData?.sampleStudyCircles || [];

  const filteredCircles = studyCircles.filter(
    (circle) =>
      circle.course.toLowerCase().includes(filterQuery.toLowerCase()) ||
      circle.topic.toLowerCase().includes(filterQuery.toLowerCase())
  );

  const completedTasks = tasks.filter((task) => task.completed).length;
  const progress = tasks.length
    ? Math.round((completedTasks / tasks.length) * 100)
    : 0;

  const filteredMentors = SAMPLE_MENTORS.filter((mentor) => {
    const query = mentorQuery.toLowerCase();

    return (
      mentor.name.toLowerCase().includes(query) ||
      mentor.domain.toLowerCase().includes(query) ||
      mentor.skills.some((skill) => skill.toLowerCase().includes(query))
    );
  });

  const filteredResources = SAMPLE_ACADEMIC_RESOURCES.filter((resource) => {
    const query = resourceQuery.toLowerCase();

    const matchesQuery =
      resource.title.toLowerCase().includes(query) ||
      resource.subject.toLowerCase().includes(query) ||
      resource.type.toLowerCase().includes(query);

    const matchesType =
      resourceType === 'All' || resource.type === resourceType;

    return matchesQuery && matchesType;
  });

  const tabs = [
    { id: 'placement', label: 'Placement Prep', icon: BriefcaseBusiness },
    { id: 'mentors', label: 'Peer Mentors', icon: Users },
    { id: 'resources', label: 'Resources', icon: BookOpen },
    { id: 'circles', label: 'Study Circles', icon: GraduationCap },
  ];

  return (
    <div className="student-hub-module">
      {/* Student Profile */}
      <div className="uni-card" style={{ marginBottom: '20px' }}>
        <div
          className="uni-card-body"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '20px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '58px',
                height: '58px',
                borderRadius: '50%',
                background: 'var(--brand-green-100)',
                color: 'var(--brand-green-700)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <GraduationCap size={30} />
            </div>

            <div>
              <h2 style={{ fontSize: '1.2rem', marginBottom: '3px' }}>
                {STUDENT_PROFILE.name}
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem' }}>
                {STUDENT_PROFILE.year} · {STUDENT_PROFILE.branch}
              </p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem' }}>
                Goal: {STUDENT_PROFILE.careerGoal}
              </p>
            </div>
          </div>

          <div>
            <p
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                marginBottom: '6px',
              }}
            >
              SKILLS
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {STUDENT_PROFILE.skills.map((skill) => (
                <span
                  key={skill}
                  style={{
                    padding: '5px 9px',
                    background: 'var(--brand-green-50)',
                    color: 'var(--brand-green-800)',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.78rem',
                  }}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Feature Navigation */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          marginBottom: '20px',
          paddingBottom: '4px',
        }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const selected = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '11px 15px',
                borderRadius: 'var(--radius-md)',
                border: `1px solid ${
                  selected
                    ? 'var(--brand-green-600)'
                    : 'var(--border-default)'
                }`,
                background: selected
                  ? 'var(--brand-green-50)'
                  : 'var(--bg-surface)',
                color: selected
                  ? 'var(--brand-green-800)'
                  : 'var(--text-secondary)',
                fontWeight: selected ? 600 : 500,
                whiteSpace: 'nowrap',
              }}
            >
              <Icon size={17} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Placement Preparation */}
      {activeTab === 'placement' && (
        <div style={{ display: 'grid', gap: '20px' }}>
          <div className="uni-card">
            <div className="uni-card-header">
              <div className="uni-card-title">
                <Target size={20} color="var(--brand-green-700)" />
                Placement Readiness
              </div>
              <span
                style={{
                  color: 'var(--brand-green-700)',
                  fontWeight: 700,
                  fontSize: '1.2rem',
                }}
              >
                {progress}%
              </span>
            </div>

            <div className="uni-card-body">
              <div
                style={{
                  height: '10px',
                  background: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-full)',
                  overflow: 'hidden',
                  marginBottom: '10px',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${progress}%`,
                    background: 'var(--brand-green-600)',
                    borderRadius: 'var(--radius-full)',
                    transition: 'width 200ms ease',
                  }}
                />
              </div>

              <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem' }}>
                {completedTasks} of {tasks.length} preparation tasks completed.
                Keep going!
              </p>
            </div>
          </div>

          <div className="uni-card">
            <div className="uni-card-header">
              <div>
                <div className="uni-card-title">
                  <CheckCircle2 size={19} color="var(--brand-green-700)" />
                  Preparation Checklist
                </div>
                <p className="uni-card-desc">
                  Check off tasks as you complete your preparation.
                </p>
              </div>
            </div>

            <div className="uni-card-body" style={{ padding: 0 }}>
              {tasks.map((task) => (
                <label
                  key={task.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '16px 20px',
                    borderBottom: '1px solid var(--border-light)',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() =>
                      setTasks((previousTasks) =>
                        previousTasks.map((item) =>
                          item.id === task.id
                            ? { ...item, completed: !item.completed }
                            : item
                        )
                      )
                    }
                    style={{ accentColor: 'var(--brand-green-600)' }}
                  />

                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontWeight: 500,
                        textDecoration: task.completed ? 'line-through' : 'none',
                        color: task.completed
                          ? 'var(--text-muted)'
                          : 'var(--text-primary)',
                      }}
                    >
                      {task.title}
                    </div>
                    <span
                      style={{
                        fontSize: '0.78rem',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {task.category}
                    </span>
                  </div>

                  {task.completed ? (
                    <CheckCircle2
                      size={19}
                      color="var(--brand-green-600)"
                    />
                  ) : (
                    <Circle size={19} color="var(--text-light)" />
                  )}
                </label>
              ))}
            </div>
          </div>

          <div className="uni-card">
            <div className="uni-card-header">
              <div className="uni-card-title">
                <Sparkles size={19} color="var(--brand-green-700)" />
                Career Focus
              </div>
            </div>
            <div className="uni-card-body">
              <p style={{ color: 'var(--text-secondary)', marginBottom: '12px' }}>
                Your current goal is to become a{' '}
                <strong style={{ color: 'var(--text-primary)' }}>
                  {STUDENT_PROFILE.careerGoal}
                </strong>
                . Use your checklist to track preparation across core subjects,
                coding practice, and interviews.
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {STUDENT_PROFILE.interests.map((interest) => (
                  <span
                    key={interest}
                    style={{
                      background: 'var(--bg-subtle)',
                      padding: '6px 10px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.82rem',
                    }}
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Peer Mentors */}
      {activeTab === 'mentors' && (
        <div className="uni-card">
          <div className="uni-card-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div className="uni-card-title">
                <Users size={20} color="var(--brand-green-700)" />
                Discover Peer Mentors
              </div>
              <p className="uni-card-desc">
                Search by mentor name, skill, or career domain.
              </p>
            </div>

            <div style={{ position: 'relative', width: 'min(100%, 280px)' }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-light)',
                }}
              />
              <input
                className="uni-input"
                value={mentorQuery}
                onChange={(event) => setMentorQuery(event.target.value)}
                placeholder="Try DSA or FinTech..."
                aria-label="Search peer mentors"
                style={{ paddingLeft: '34px', width: '100%' }}
              />
            </div>
          </div>

          <div
            className="uni-card-body"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
              gap: '14px',
            }}
          >
            {filteredMentors.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>
                No mentors match that search. Try another skill or domain.
              </p>
            ) : (
              filteredMentors.map((mentor) => {
                const requested = requestedMentors.includes(mentor.id);

                return (
                  <div
                    key={mentor.id}
                    style={{
                      border: '1px solid var(--border-default)',
                      borderRadius: 'var(--radius-md)',
                      padding: '18px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '50%',
                          background: 'var(--brand-green-50)',
                          color: 'var(--brand-green-700)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Users size={21} />
                      </div>
                      <div>
                        <strong>{mentor.name}</strong>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                          {mentor.year} · {mentor.domain}
                        </p>
                      </div>
                    </div>

                    <p
                      style={{
                        color: 'var(--text-secondary)',
                        fontSize: '0.86rem',
                        flex: 1,
                      }}
                    >
                      {mentor.description}
                    </p>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {mentor.skills.map((skill) => (
                        <span
                          key={skill}
                          style={{
                            background: 'var(--bg-subtle)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '4px 7px',
                            fontSize: '0.76rem',
                          }}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setRequestedMentors((previous) =>
                          requested
                            ? previous.filter((id) => id !== mentor.id)
                            : [...previous, mentor.id]
                        )
                      }
                      style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--brand-green-600)',
                        background: requested
                          ? 'var(--brand-green-50)'
                          : 'var(--brand-green-600)',
                        color: requested
                          ? 'var(--brand-green-800)'
                          : '#ffffff',
                        fontWeight: 600,
                      }}
                    >
                      {requested ? <CheckCircle2 size={16} /> : <Send size={16} />}
                      {requested ? 'Request Sent · Undo' : 'Request Mentorship'}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Academic Resources */}
      {activeTab === 'resources' && (
        <div className="uni-card">
          <div className="uni-card-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div className="uni-card-title">
                <BookOpen size={20} color="var(--brand-green-700)" />
                Academic Resource Library
              </div>
              <p className="uni-card-desc">
                Find reference notes and practice material by subject or type.
              </p>
            </div>

            <div style={{ position: 'relative', width: 'min(100%, 280px)' }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-light)',
                }}
              />
              <input
                className="uni-input"
                value={resourceQuery}
                onChange={(event) => setResourceQuery(event.target.value)}
                placeholder="Search resources..."
                aria-label="Search academic resources"
                style={{ paddingLeft: '34px', width: '100%' }}
              />
            </div>
          </div>

          <div className="uni-card-body">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px',
                marginBottom: '16px',
              }}
            >
              <Filter size={16} color="var(--text-secondary)" />
              {['All', 'Notes', 'Question Paper', 'Interview Prep'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setResourceType(type)}
                  style={{
                    padding: '7px 11px',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid var(--border-default)',
                    background:
                      resourceType === type
                        ? 'var(--brand-green-50)'
                        : 'var(--bg-surface)',
                    color:
                      resourceType === type
                        ? 'var(--brand-green-800)'
                        : 'var(--text-secondary)',
                    fontSize: '0.82rem',
                    fontWeight: resourceType === type ? 600 : 400,
                  }}
                >
                  {type}
                </button>
              ))}
            </div>

            {filteredResources.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', padding: '20px 0' }}>
                No resources found. Try changing your search or filter.
              </p>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {filteredResources.map((resource) => (
                  <div
                    key={resource.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px',
                      padding: '15px',
                      border: '1px solid var(--border-default)',
                      borderRadius: 'var(--radius-md)',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <BookOpen size={21} color="var(--brand-green-700)" />
                      <div>
                        <strong style={{ fontSize: '0.9rem' }}>
                          {resource.title}
                        </strong>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                          {resource.subject} · {resource.type} · {resource.semester}
                        </p>
                      </div>
                    </div>

                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: 'var(--brand-green-700)',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                      }}
                    >
                      Open Resource <ExternalLink size={15} />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Study Circles */}
      {activeTab === 'circles' && (
        <div className="uni-card">
          <div className="uni-card-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div className="uni-card-title">
                <GraduationCap size={20} color="var(--brand-green-700)" />
                Sample Study Circles
              </div>
              <p className="uni-card-desc">
                Search sample study groups by course or topic.
              </p>
            </div>

            <div style={{ position: 'relative', width: 'min(100%, 280px)' }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-light)',
                }}
              />
              <input
                className="uni-input"
                value={filterQuery}
                onChange={(event) => setFilterQuery(event.target.value)}
                placeholder="Filter course or topic..."
                aria-label="Filter study circles"
                style={{ paddingLeft: '34px', width: '100%' }}
              />
            </div>
          </div>

          <div className="uni-card-body" style={{ padding: 0 }}>
            {filteredCircles.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No study circles match "{filterQuery}".
                <button
                  type="button"
                  onClick={() => setFilterQuery('')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    marginLeft: '8px',
                    color: 'var(--brand-green-700)',
                  }}
                >
                  <X size={14} /> Clear
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {filteredCircles.map((circle) => (
                  <div
                    key={circle.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px 20px',
                      borderBottom: '1px solid var(--border-light)',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '0.92rem' }}>
                        {circle.course}
                      </strong>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        Focus: <em>{circle.topic}</em>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '18px', fontSize: '0.82rem' }}>
                      <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Users size={14} /> {circle.members} Members
                      </span>
                      <span style={{ color: 'var(--brand-green-700)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={14} /> {circle.nextSession}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
