'use client';

import { useState, useEffect } from 'react';
import { Clock, Trash2, ArrowDown, ArrowUp, Timer, Flame, Package, Save, Download, Edit2, X, Check } from 'lucide-react';

const COLABORADORES = ["BRENDA", "NAOMY", "PEDRO", "STEVEN", "ALVARO"];
const ESTACIONES = ["PLANCHA", "PACKER"];

type Registro = {
  id: string;
  colaborador: string;
  estacion: string;
  horaInicio: string;
  horaFin: string;
  tiempoTotal: number;
  fecha: string;
};

// Utilidad extraída para evitar re-creación
const getCurrentTime = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
};

// Componente StationCard extraído
const StationCard = ({ title, icon: Icon, colorClass, borderClass, collab, setCollab, start, setStart, end, setEnd, onSave }: any) => (
  <div className={`bg-white p-4 rounded-2xl shadow-sm border-t-4 ${borderClass} flex flex-col gap-4`}>
    <div className="flex items-center gap-2">
      <div className={`p-2 rounded-lg ${colorClass} text-white`}>
        <Icon size={24} />
      </div>
      <h2 className="text-xl font-black text-gray-800 tracking-tight">{title}</h2>
    </div>

    <select value={collab} onChange={(e) => setCollab(e.target.value)} className="w-full p-4 bg-gray-100 rounded-xl font-bold text-gray-700 text-lg border-2 border-transparent focus:border-blue-500 focus:outline-none appearance-none">
      <option value="">👤 Asignar colaborador...</option>
      {COLABORADORES.map(c => <option key={c} value={c}>{c}</option>)}
    </select>

    <div className="flex flex-col sm:flex-row gap-3">
      <div className="flex-1">
        <label className="text-xs font-bold text-gray-400 ml-1 uppercase tracking-wider">Sale Comanda</label>
        <div className="flex mt-1 bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
          <input type="time" value={start} onChange={(e) => setStart(e.target.value)} className="w-full bg-transparent p-3 font-semibold text-lg outline-none" />
          <button onClick={() => setStart(getCurrentTime())} className="px-4 bg-gray-200 text-gray-600 hover:bg-gray-300 font-bold"><Clock size={20} /></button>
        </div>
      </div>
      <div className="flex-1">
        <label className="text-xs font-bold text-gray-400 ml-1 uppercase tracking-wider">Entrega</label>
        <div className="flex mt-1 bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
          <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className="w-full bg-transparent p-3 font-semibold text-lg outline-none" />
          <button onClick={() => setEnd(getCurrentTime())} className="px-4 bg-gray-200 text-gray-600 hover:bg-gray-300 font-bold"><Clock size={20} /></button>
        </div>
      </div>
    </div>

    <button onClick={onSave} className="mt-2 w-full bg-green-600 text-white p-4 rounded-xl font-bold text-lg flex justify-center items-center gap-2 shadow-md active:scale-95 transition-transform">
      <Save size={24} /> GUARDAR {title}
    </button>
  </div>
);

// Componente EditRegistroRow extraído
const EditRegistroRow = ({ registro, onSave, onCancel }: { registro: Registro, onSave: (r: Registro) => void, onCancel: () => void }) => {
  const [editData, setEditData] = useState(registro);

  return (
    <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 flex flex-col gap-3">
      <div className="flex justify-between items-center mb-1">
        <span className="font-bold text-yellow-800 text-sm">Modo Edición</span>
        <button onClick={onCancel} className="text-gray-500 hover:text-gray-700 bg-white rounded-full p-1"><X size={16}/></button>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <select value={editData.colaborador} onChange={e => setEditData({...editData, colaborador: e.target.value})} className="p-2 border rounded-lg bg-white text-sm font-bold">
          {COLABORADORES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={editData.estacion} onChange={e => setEditData({...editData, estacion: e.target.value})} className="p-2 border rounded-lg bg-white text-sm font-bold">
          {ESTACIONES.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <input type="time" value={editData.horaInicio} onChange={e => setEditData({...editData, horaInicio: e.target.value})} className="p-2 border rounded-lg bg-white text-center font-mono" />
        <input type="time" value={editData.horaFin} onChange={e => setEditData({...editData, horaFin: e.target.value})} className="p-2 border rounded-lg bg-white text-center font-mono" />
      </div>

      <button onClick={() => onSave(editData)} className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 rounded-lg flex justify-center items-center gap-2">
        <Check size={18} /> Guardar Cambios
      </button>
    </div>
  );
};

export default function Home() {
  // Configuración y Registros
  const [baseTime, setBaseTime] = useState<number>(5);
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Estados de Carril: PLANCHA
  const [planchaCollab, setPlanchaCollab] = useState<string>('');
  const [planchaStart, setPlanchaStart] = useState<string>('');
  const [planchaEnd, setPlanchaEnd] = useState<string>('');

  // Estados de Carril: PACKER
  const [packerCollab, setPackerCollab] = useState<string>('');
  const [packerStart, setPackerStart] = useState<string>('');
  const [packerEnd, setPackerEnd] = useState<string>('');

  // Cargar datos iniciales
  useEffect(() => {
    const savedTime = localStorage.getItem('baseTime');
    const savedRecords = localStorage.getItem('registros');
    const savedPlanchaCollab = localStorage.getItem('planchaCollab');
    const savedPackerCollab = localStorage.getItem('packerCollab');
    
    if (savedTime) setBaseTime(Number(savedTime));
    if (savedRecords) setRegistros(JSON.parse(savedRecords));
    if (savedPlanchaCollab) setPlanchaCollab(savedPlanchaCollab);
    if (savedPackerCollab) setPackerCollab(savedPackerCollab);
    
    setIsLoaded(true);
  }, []);

  // Sincronizar con localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('baseTime', baseTime.toString());
      localStorage.setItem('registros', JSON.stringify(registros));
      localStorage.setItem('planchaCollab', planchaCollab);
      localStorage.setItem('packerCollab', packerCollab);
    }
  }, [baseTime, registros, planchaCollab, packerCollab, isLoaded]);

  const calculateMinutes = (start: string, end: string) => {
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    let diff = (endH * 60 + endM) - (startH * 60 + startM);
    if (diff < 0) diff += 24 * 60; 
    return diff;
  };

  const handleGuardar = (estacion: 'PLANCHA' | 'PACKER') => {
    const isPlancha = estacion === 'PLANCHA';
    const collab = isPlancha ? planchaCollab : packerCollab;
    const start = isPlancha ? planchaStart : packerStart;
    const end = isPlancha ? planchaEnd : packerEnd;

    if (!collab) {
      alert(`Asigna un colaborador a ${estacion}.`);
      return;
    }
    if (!start || !end) {
      alert(`Faltan horas en ${estacion}.`);
      return;
    }

    const tiempoTotal = calculateMinutes(start, end);
    const fechaActual = new Date().toLocaleDateString('es-PE');
    
    const nuevoRegistro: Registro = {
      id: Date.now().toString(),
      colaborador: collab,
      estacion,
      horaInicio: start,
      horaFin: end,
      tiempoTotal,
      fecha: fechaActual,
    };

    setRegistros([nuevoRegistro, ...registros]);
    
    if (isPlancha) {
      setPlanchaStart('');
      setPlanchaEnd('');
    } else {
      setPackerStart('');
      setPackerEnd('');
    }
  };

  const handleDeleteRegistro = (id: string) => {
    if (window.confirm("¿Seguro que quieres eliminar este registro?")) {
      setRegistros(registros.filter(reg => reg.id !== id));
    }
  };

  const handleUpdateRegistro = (updatedRegistro: Registro) => {
    const recalculatedTime = calculateMinutes(updatedRegistro.horaInicio, updatedRegistro.horaFin);
    const finalizedRegistro = { ...updatedRegistro, tiempoTotal: recalculatedTime };
    
    setRegistros(registros.map(reg => reg.id === finalizedRegistro.id ? finalizedRegistro : reg));
    setEditingId(null);
  };

  const handleLimpiar = () => {
    if (window.confirm("¿Confirmas eliminar TODOS los registros de hoy?")) {
      setRegistros([]);
      localStorage.removeItem('registros');
    }
  };

  const handleExportarCSV = () => {
    if (registros.length === 0) return;
    const headers = ["Colaborador", "Estacion", "Hora Inicio", "Hora Fin", "Tiempo (min)", "Fecha"];
    const csvRows = registros.map(r => [r.colaborador, r.estacion, r.horaInicio, r.horaFin, r.tiempoTotal, r.fecha].join(","));
    const csvContent = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.body.appendChild(document.createElement("a"));
    link.href = url;
    link.download = `Reporte_Produccion_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!isLoaded) return null;

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 pb-12 font-sans">
      <header className="bg-blue-700 text-white p-4 shadow-md sticky top-0 z-10 flex justify-between items-center">
        <h1 className="text-lg font-black flex items-center gap-2 tracking-tight">
          <Timer size={22} /> TRACKER RUSH
        </h1>
        <div className="flex items-center gap-2 bg-blue-800 px-3 py-1.5 rounded-lg border border-blue-600">
          <label className="text-xs font-bold uppercase tracking-wider text-blue-200">Meta:</label>
          <input type="number" value={baseTime} onChange={(e) => setBaseTime(Number(e.target.value) || 0)} className="w-10 bg-transparent text-white font-black text-lg outline-none text-center" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6 mt-2">
        <div className="grid md:grid-cols-2 gap-4">
          <StationCard title="PLANCHA" icon={Flame} colorClass="bg-orange-500" borderClass="border-orange-500" collab={planchaCollab} setCollab={setPlanchaCollab} start={planchaStart} setStart={setPlanchaStart} end={planchaEnd} setEnd={setPlanchaEnd} onSave={() => handleGuardar('PLANCHA')} />
          <StationCard title="PACKER" icon={Package} colorClass="bg-blue-500" borderClass="border-blue-500" collab={packerCollab} setCollab={setPackerCollab} start={packerStart} setStart={setPackerStart} end={packerEnd} setEnd={setPackerEnd} onSave={() => handleGuardar('PACKER')} />
        </div>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
          <div className="flex flex-wrap justify-between items-center mb-4 gap-2 border-b border-gray-100 pb-3">
            <h2 className="text-lg font-bold text-gray-700">Registros Recientes</h2>
            <div className="flex gap-2">
              {registros.length > 0 && (
                <>
                  <button onClick={handleExportarCSV} className="bg-blue-50 text-blue-700 flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold text-sm hover:bg-blue-100 transition-colors">
                    <Download size={16} /> CSV
                  </button>
                  <button onClick={handleLimpiar} className="bg-red-50 text-red-600 flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold text-sm hover:bg-red-100 transition-colors">
                    <Trash2 size={16} /> Limpiar
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
            {registros.length === 0 ? (
              <p className="text-center text-gray-400 py-10 font-medium">Sin registros. ¡A darle al rush!</p>
            ) : (
              registros.map((reg) => (
                editingId === reg.id ? (
                  <EditRegistroRow key={reg.id} registro={reg} onSave={handleUpdateRegistro} onCancel={() => setEditingId(null)} />
                ) : (
                  <div key={reg.id} className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex items-center justify-between group">
                    <div className="flex-1">
                      <h3 className="font-black text-base text-gray-800 leading-none">{reg.colaborador}</h3>
                      <div className="flex gap-2 mt-1.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${reg.estacion === 'PLANCHA' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>{reg.estacion}</span>
                      </div>
                      <p className="text-[11px] text-gray-500 font-bold mt-1 tracking-wider">{reg.horaInicio} - {reg.horaFin}</p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity md:flex-col">
                        <button onClick={() => setEditingId(reg.id)} className="p-1.5 bg-gray-200 text-gray-600 hover:bg-yellow-200 hover:text-yellow-700 rounded-md transition-colors"><Edit2 size={14}/></button>
                        <button onClick={() => handleDeleteRegistro(reg.id)} className="p-1.5 bg-gray-200 text-gray-600 hover:bg-red-200 hover:text-red-700 rounded-md transition-colors"><Trash2 size={14}/></button>
                      </div>

                      <div className={`flex flex-col items-end justify-center w-16 h-16 rounded-lg ${reg.tiempoTotal <= baseTime ? 'bg-green-100' : 'bg-red-100'}`}>
                        <div className={`flex items-center font-black text-xl leading-none ${reg.tiempoTotal <= baseTime ? 'text-green-700' : 'text-red-700'}`}>
                          {reg.tiempoTotal}
                        </div>
                        <span className={`text-[10px] font-bold uppercase mt-0.5 ${reg.tiempoTotal <= baseTime ? 'text-green-600' : 'text-red-600'}`}>min</span>
                      </div>
                    </div>
                  </div>
                )
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}