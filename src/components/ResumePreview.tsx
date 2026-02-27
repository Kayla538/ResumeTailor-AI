import React, { forwardRef } from 'react';
import { ResumeData } from '../lib/aiTailor';

interface ResumePreviewProps {
  data: ResumeData;
}

export const ResumePreview = forwardRef<HTMLDivElement, ResumePreviewProps>(
  ({ data }, ref) => {
    if (!data) return null;

    const sectionTitleStyle: React.CSSProperties = {
      color: '#1a3a5a',
      fontSize: '1.25rem', // Reduced from 1.5rem
      fontWeight: 'bold',
      marginTop: '0.75rem', // Reduced from 1.25rem
      marginBottom: '0.15rem', // Reduced from 0.25rem
    };

    const bodyTextStyle: React.CSSProperties = {
      fontSize: '10pt', // Reduced from 11pt
      lineHeight: '1.25', // Reduced from 1.35
      color: '#111827',
    };

    return (
      <div
        ref={ref}
        id="resume-to-print"
        style={{ 
          width: '210mm', 
          height: '297mm', // Fixed A4 Height
          fontFamily: 'Georgia, serif',
          color: '#111827',
          backgroundColor: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          margin: '0 auto',
          overflow: 'hidden',
          boxSizing: 'border-box',
          position: 'relative',
          boxShadow: '0 0 20px rgba(0,0,0,0.1)' // Added shadow for "paper" feel in preview
        }}
      >
        {/* HEADER - DARK BLUE */}
        <header 
          style={{ 
            backgroundColor: '#1a3a5a', 
            color: '#ffffff',
            padding: '2rem 3rem', // Reduced from 3.5rem vertical
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'center',
            textAlign: 'left',
            flexShrink: 0,
            boxSizing: 'border-box'
          }}
        >
          <h1 style={{ 
            fontSize: '2.5rem',
            fontWeight: 'bold',
            marginBottom: '0.75rem', // Increased to prevent merging
          }}>
            {data.personalInfo?.name || 'Your Name'}
          </h1>
          <div style={{ 
            fontSize: '1rem',
            fontFamily: 'Inter, system-ui, sans-serif',
            display: 'flex',
            gap: '0.5rem',
            flexWrap: 'wrap',
            alignItems: 'center',
            letterSpacing: '0.03em', // Increased spacing for clarity
          }}>
            <span style={{ opacity: 0.9 }}>{data.personalInfo?.email}</span>
            <span style={{ opacity: 0.5 }}>|</span>
            <span style={{ opacity: 0.9 }}>{data.personalInfo?.phone}</span>
            <span style={{ opacity: 0.5 }}>|</span>
            <span style={{ opacity: 0.9 }}>{data.personalInfo?.location}</span>
          </div>
        </header>

        {/* BODY CONTENT - VERTICAL FLOW (NO OVERLAP) */}
        <div style={{ 
          padding: '1rem 3rem', // Reduced from 2rem vertical
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          boxSizing: 'border-box'
        }}>
          
          {/* SUMMARY SECTION */}
          <section style={{ marginBottom: '0.5rem' }}>
            <h2 style={{ ...sectionTitleStyle, marginTop: 0 }}>
              Summary
            </h2>
            <p style={bodyTextStyle}>
              {data.summary}
            </p>
          </section>

          {/* EXPERIENCE SECTION */}
          <section style={{ marginBottom: '0.5rem' }}>
            <h2 style={sectionTitleStyle}>
              Work Experience
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {data.experience && data.experience.length > 0 ? (
                data.experience.map((job, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '11pt', lineHeight: '1.1' }}>
                      {job.company}
                    </div>
                    <div style={{ 
                      fontSize: '10pt', 
                      marginTop: '0.1rem', 
                      marginBottom: '0.15rem', 
                      lineHeight: '1.1' 
                    }}>
                      <span style={{ fontStyle: 'italic' }}>{job.position}</span> | {job.startDate}{job.endDate ? ` - ${job.endDate}` : ''}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', marginTop: '0.1rem' }}>
                      {job.bullets?.map((bullet, j) => (
                        <div key={j} style={{ 
                          display: 'flex', 
                          alignItems: 'flex-start', 
                          gap: '0.6rem', 
                          fontSize: '9.5pt', 
                          lineHeight: '1.25' 
                        }}>
                          <span style={{ flexShrink: 0, marginTop: '0.1rem' }}>•</span>
                          <span>{bullet}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ fontSize: '10pt', fontStyle: 'italic' }}>No experience listed.</p>
              )}
            </div>
          </section>

          {/* EDUCATION SECTION */}
          <section style={{ marginBottom: '0.5rem' }}>
            <h2 style={sectionTitleStyle}>
              Education
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {data.education && data.education.length > 0 ? (
                data.education.map((edu, i) => (
                  <div key={i} style={{ fontSize: '10pt', lineHeight: '1.2' }}>
                    <div style={{ fontWeight: 'bold' }}>{edu.institution}</div>
                    <div style={{ fontStyle: 'italic' }}>{edu.degree} | {edu.endDate}</div>
                  </div>
                ))
              ) : (
                <p style={{ fontSize: '10pt', fontStyle: 'italic' }}>No education listed.</p>
              )}
            </div>
          </section>

          {/* CERTIFICATIONS SECTION */}
          {data.certifications && data.certifications.length > 0 && (
            <section style={{ marginBottom: '0.5rem' }}>
              <h2 style={sectionTitleStyle}>
                Certifications
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                {data.certifications.map((cert, i) => (
                  <div key={i} style={{ fontWeight: 'bold', fontSize: '10pt', lineHeight: '1.2' }}>{cert}</div>
                ))}
              </div>
            </section>
          )}

          {/* SKILLS SECTION */}
          <section style={{ marginBottom: '1rem' }}>
            <h2 style={sectionTitleStyle}>
              Skills
            </h2>
            <p style={{ ...bodyTextStyle, lineHeight: '1.3' }}>
              {data.skills?.join(', ')}
            </p>
          </section>

        </div>
      </div>
    );
  }
);

ResumePreview.displayName = 'ResumePreview';
