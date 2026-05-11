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

// Utilidad extraída
const getCurrentTime = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
};

// Componente StationCard (Mejorado para Mobile)
const StationCard = ({ title, icon: Icon, colorClass, borderClass, collab, setCollab, start, setStart, end, setEnd, onSave }: any) => (
  <div className={`bg-white p-5 rounded-2xl shadow-md border-t-8 ${borderClass} flex flex-col gap-5`}>
    <div className="flex items-center gap-3">
      <div className={`p-2.5 rounded-xl ${colorClass} text-white shadow-sm`}>
        <Icon size={26} />
      </div>
      <h2 className="text-2xl font-black text-gray-800 tracking-tight">{title}</h2>
    </div>

    <select 
      value={collab} 
      onChange={(e) => setCollab(e.target.value)} 
      className="w-full p-4 bg-gray-50 rounded-xl font-black text-gray-800 text-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none appearance-none shadow-sm"
    >
      <option value="">👤 SELECCIONAR...</option>
      {COLABORADORES.map(c => <option key={c} value={c}>{c}</option>)}
    </select>

    <div className="flex flex-col gap-4">
      {/* Input Sale Comanda */}
      <div>
        <label className="text-sm font-black text-gray-500 ml-1 uppercase tracking-wider block mb-1">Sale Comanda</label>
        <div className="flex bg-white border-2 border-gray-200 rounded-xl overflow-hidden focus-within:border-blue-500 shadow-inner">
          <input 
            type="time" 
            value={start} 
            onChange={(e) => setStart(e.target.value)} 
            // El selector ocultará el ícono nativo del reloj en Chrome/Safari
            className="w-full bg-transparent p-3 font-black text-2xl text-center outline-none text-gray-800 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none" 
          />
          <button 
            onClick={() => setStart(getCurrentTime())} 
            className="px-6 bg-blue-100 text-blue-700 hover:bg-blue-200 active:bg-blue-300 font-bold border-l-2 border-gray-200 flex items-center justify-center transition-colors"
          >
            <Clock size={26} />
          </button>
        </div>
      </div>

      {/* Input Entrega */}
      <div>
        <label className="text-sm font-black text-gray-500 ml-1 uppercase tracking-wider block mb-1">Entrega</label>
        <div className="flex bg-white border-2 border-gray-200 rounded-xl overflow-hidden focus-within:border-blue-500 shadow-inner">
          <input 
            type="time" 
            value={end} 
            onChange={(e) => setEnd(e.target.value)} 
            className="w-full bg-transparent p-3 font-black text-2xl text-center outline-none text-gray-800 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none" 
          />
          <button 
            onClick={() => setEnd(getCurrentTime())} 
            className="px-6 bg-blue-100 text-blue-700 hover:bg-blue-200 active:bg-blue-300 font-bold border-l-2 border-gray-200 flex items-center justify-center transition-colors"
          >
            <Clock size={26} />
          </button>
        </div>
      </div>
    </div>

    <button 
      onClick={onSave} 
      className="mt-2 w-full bg-green-600 active:bg-green-700 text-white p-5 rounded-xl font-black text-xl flex justify-center items-center gap-2 shadow-lg active:scale-[0.98] transition-transform"
    >
      <Save size={28} /> GUARDAR {title}
    </button>
  </div>
);

// Componente EditRegistroRow
const EditRegistroRow = ({ registro, onSave, onCancel }: { registro: Registro, onSave: (r: Registro) => void, onCancel: () => void }) => {
  const [editData, setEditData] = useState(registro);

  return (
    <div className="bg-yellow-50 p-4 rounded-xl border-2 border-yellow-300 flex flex-col gap-3 shadow-sm">
      <div className="flex justify-between items-center mb-1">
        <span className="font-black text-yellow-800 text-sm uppercase">Modo Edición</span>
        <button onClick={onCancel} className="text-gray-500 active:text-gray-800 bg-white rounded-full p-1.5 shadow-sm"><X size={20}/></button>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <select value={editData.colaborador} onChange={e => setEditData({...editData, colaborador: e.target.value})} className="p-3 border-2 border-yellow-200 rounded-lg bg-white text-base font-black">
          {COLABORADORES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={editData.estacion} onChange={e => setEditData({...editData, estacion: e.target.value})} className="p-3 border-2 border-yellow-200 rounded-lg bg-white text-base font-black">
          {ESTACIONES.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <input type="time" value={editData.horaInicio} onChange={e => setEditData({...editData, horaInicio: e.target.value})} className="p-3 border-2 border-yellow-200 rounded-lg bg-white text-center font-black text-lg [&::-webkit-calendar-picker-indicator]:hidden" />
        <input type="time" value={editData.horaFin} onChange={e => setEditData({...editData, horaFin: e.target.value})} className="p-3 border-2 border-yellow-200 rounded-lg bg-white text-center font-black text-lg [&::-webkit-calendar-picker-indicator]:hidden" />
      </div>

      <button onClick={() => onSave(editData)} className="w-full bg-yellow-500 active:bg-yellow-600 text-white font-black py-4 rounded-lg flex justify-center items-center gap-2 text-lg shadow-sm">
        <Check size={24} /> Guardar Cambios
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

  // Estados de Carril
  const [planchaCollab, setPlanchaCollab] = useState<string>('');
  const [planchaStart, setPlanchaStart] = useState<string>('');
  const [planchaEnd, setPlanchaEnd] = useState<string>('');

  const [packerCollab, setPackerCollab] = useState<string>('');
  const [packerStart, setPackerStart] = useState<string>('');
  const [packerEnd, setPackerEnd] = useState<string>('');

  // Cargar datos
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

  // Guardar datos
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
      alert(`Falta asignar colaborador a ${estacion}.`);
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
    link.download = `Reporte_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!isLoaded) return null;

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 pb-12 font-sans">
      <header className="bg-blue-700 text-white p-4 shadow-md sticky top-0 z-10 flex justify-between items-center">
        <h1 className="text-xl font-black flex items-center gap-2 tracking-tight">
          <Timer size={26} /> TRACKER
        </h1>
        <div className="flex items-center gap-2 bg-blue-800 px-3 py-2 rounded-xl border border-blue-600 shadow-inner">
          <label className="text-sm font-black uppercase text-blue-200">Meta:</label>
          <input type="number" value={baseTime} onChange={(e) => setBaseTime(Number(e.target.value) || 0)} className="w-12 bg-transparent text-white font-black text-xl outline-none text-center" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-3 space-y-6 mt-2">
        <div className="grid md:grid-cols-2 gap-5">
          <StationCard title="PLANCHA" icon={Flame} colorClass="bg-orange-500" borderClass="border-orange-500" collab={planchaCollab} setCollab={setPlanchaCollab} start={planchaStart} setStart={setPlanchaStart} end={planchaEnd} setEnd={setPlanchaEnd} onSave={() => handleGuardar('PLANCHA')} />
          <StationCard title="PACKER" icon={Package} colorClass="bg-blue-500" borderClass="border-blue-500" collab={packerCollab} setCollab={setPackerCollab} start={packerStart} setStart={setPackerStart} end={packerEnd} setEnd={setPackerEnd} onSave={() => handleGuardar('PACKER')} />
        </div>

        <section className="bg-white rounded-2xl shadow-md border border-gray-200 p-4">
          <div className="flex flex-wrap justify-between items-center mb-5 gap-2 border-b-2 border-gray-100 pb-4">
            <h2 className="text-xl font-black text-gray-800">Registros</h2>
            <div className="flex gap-2">
              {registros.length > 0 && (
                <>
                  <button onClick={handleExportarCSV} className="bg-blue-100 text-blue-700 flex items-center gap-2 px-4 py-2 rounded-xl font-black text-sm active:bg-blue-200 transition-colors">
                    <Download size={18} /> CSV
                  </button>
                  <button onClick={handleLimpiar} className="bg-red-100 text-red-600 flex items-center gap-2 px-4 py-2 rounded-xl font-black text-sm active:bg-red-200 transition-colors">
                    <Trash2 size={18} /> Limpiar
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
            {registros.length === 0 ? (
              <p className="text-center text-gray-400 py-10 font-bold text-lg">Sin registros. ¡A darle al rush!</p>
            ) : (
              registros.map((reg) => (
                editingId === reg.id ? (
                  <EditRegistroRow key={reg.id} registro={reg} onSave={handleUpdateRegistro} onCancel={() => setEditingId(null)} />
                ) : (
                  <div key={reg.id} className="bg-white p-4 rounded-2xl border-2 border-gray-100 shadow-sm flex items-center justify-between gap-2">
                    <div className="flex-1">
                      <h3 className="font-black text-xl text-gray-800 leading-none">{reg.colaborador}</h3>
                      <div className="flex gap-2 mt-2">
                        <span className={`text-xs font-black px-2 py-1 rounded-md uppercase ${reg.estacion === 'PLANCHA' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>{reg.estacion}</span>
                      </div>
                      <p className="text-sm text-gray-500 font-bold mt-2 tracking-widest">{reg.horaInicio} - {reg.horaFin}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Botones de acción siempre visibles en móvil */}
                      <div className="flex flex-col gap-2">
                        <button onClick={() => setEditingId(reg.id)} className="p-2.5 bg-yellow-100 text-yellow-700 active:bg-yellow-200 rounded-xl transition-colors shadow-sm"><Edit2 size={18}/></button>
                        <button onClick={() => handleDeleteRegistro(reg.id)} className="p-2.5 bg-red-100 text-red-700 active:bg-red-200 rounded-xl transition-colors shadow-sm"><Trash2 size={18}/></button>
                      </div>

                      <div className={`flex flex-col items-center justify-center w-20 h-20 rounded-2xl shadow-inner ${reg.tiempoTotal <= baseTime ? 'bg-green-100' : 'bg-red-100'}`}>
                        <div className={`flex items-center font-black text-3xl leading-none ${reg.tiempoTotal <= baseTime ? 'text-green-700' : 'text-red-700'}`}>
                          {reg.tiempoTotal}
                        </div>
                        <span className={`text-xs font-black uppercase mt-1 ${reg.tiempoTotal <= baseTime ? 'text-green-600' : 'text-red-600'}`}>min</span>
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