import React from 'react';
import { ArrowUpRight, Clock, Sparkles } from 'lucide-react';
import { projects, PortalProject } from '../data/projects';

interface PortalHomeProps {
  onOpenProject: (projectId: string) => void;
}

const todayLabel = new Intl.DateTimeFormat('es-PE', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
}).format(new Date());

export const PortalHome: React.FC<PortalHomeProps> = ({ onOpenProject }) => {
  const activeCount = projects.filter((p) => p.status === 'active').length;
  const upcomingCount = projects.filter((p) => p.status === 'upcoming').length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 relative overflow-hidden">
      {/* Fondo atmosférico institucional */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(1100px 520px at 15% -10%, rgba(56,189,248,0.10), transparent), radial-gradient(1000px 500px at 95% 110%, rgba(244,63,94,0.08), transparent)',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.05]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
        }}
      />

      <div className="relative z-10 flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col">
        {/* Top Bar */}
        <header className="flex items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-slate-700 to-slate-900 border border-white/15 flex items-center justify-center shadow-lg">
              <span className="text-lg font-black text-white">S</span>
            </div>
            <div>
              <span className="text-base font-black tracking-tight text-white uppercase">
                SENATI
              </span>
              <p className="text-xs text-slate-400">
                Intranet Institucional · Área de Sistemas
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300">
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            <span className="capitalize">{todayLabel}</span>
          </div>
        </header>

        {/* Hero */}
        <div className="py-10 sm:py-14 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-sky-500/30 text-[11px] font-semibold text-sky-300 uppercase tracking-widest mb-6">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Portal de Proyectos
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Centro de Proyectos &amp; <br className="sm:hidden" />
            <span className="bg-gradient-to-r from-sky-400 via-rose-400 to-amber-300 bg-clip-text text-transparent">
              Aplicaciones Institucionales
            </span>
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto mt-4 leading-relaxed">
            Selecciona un proyecto para ingresar. Los sistemas en desarrollo se
            encuentran marcados como «Próximamente».
          </p>
        </div>

        {/* Grid de Proyectos */}
        <main className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onOpen={onOpenProject}
            />
          ))}
        </main>

        {/* Footer */}
        <footer className="mt-auto pt-8 text-center text-[11px] text-slate-500 space-y-1">
          <p>
            © {new Date().getFullYear()} SENATI · Dirección de Tecnologías de la Información
          </p>
          <p>
            {activeCount} proyecto activo · {upcomingCount} en desarrollo
          </p>
        </footer>
      </div>
    </div>
  );
};

const ProjectCard: React.FC<{
  project: PortalProject;
  onOpen: (projectId: string) => void;
}> = ({ project, onOpen }) => {
  const Icon = project.icon;
  const isActive = project.status === 'active';

  return (
    <div
      title={isActive ? undefined : 'Próximamente disponible'}
      className={`w-full rounded-2xl border p-6 text-left transition-all duration-300 ${
        isActive
          ? 'group bg-slate-900/70 border-white/10 hover:border-sky-500/40 hover:bg-slate-900 hover:-translate-y-1 hover:shadow-2xl hover:shadow-sky-500/10 cursor-pointer'
          : 'bg-slate-900/40 border-white/5 opacity-60 cursor-not-allowed select-none'
      }`}
    >
      <button
        onClick={() => isActive && onOpen(project.id)}
        disabled={!isActive}
        className={`text-left w-full ${isActive ? 'cursor-pointer' : 'cursor-not-allowed'}`}
      >
        {isActive ? (
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr to-sky-500 p-0.5 shadow-lg shadow-sky-500/20 mb-4">
            <div className={`w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center bg-gradient-to-tr ${project.gradient}`}>
              <Icon className="w-7 h-7 text-white" />
            </div>
          </div>
        ) : (
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${project.gradient} p-0.5 mb-4 opacity-80`}>
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Icon className="w-7 h-7 text-slate-400" />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
            Proyecto {project.id.split('-')[0].toUpperCase()}
          </span>
          {isActive && project.badge ? (
            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/30 rounded-md">
              {project.badge}
            </span>
          ) : (
            <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/25 rounded-full">
              Próximamente
            </span>
          )}
        </div>

        <h2 className={`text-lg font-bold tracking-tight ${isActive ? 'text-white group-hover:text-sky-400' : 'text-slate-300'}`}>
          {project.title}
        </h2>
        <p className="text-[13px] text-slate-400 leading-relaxed mt-1.5 min-h-[60px]">
          {project.description}
        </p>

        <div className="flex items-center gap-1.5 text-xs font-semibold mt-4">
          {isActive ? (
            <>
              <span className="text-sky-400 group-hover:gap-2.5 transition-all inline-flex items-center gap-1.5">
                Ingresar al proyecto
                <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </span>
            </>
          ) : (
            <span className="text-slate-500 inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Disponible próximamente
            </span>
          )}
        </div>
      </button>
    </div>
  );
};