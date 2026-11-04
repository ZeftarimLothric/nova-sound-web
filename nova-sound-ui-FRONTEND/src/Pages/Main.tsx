import { useState } from 'react';
import { RolesEnum } from '../types/database';
import { usePlanta } from '../context/PlantaContext';

import Topbar from '../components/Topbar';
import type { MenuItem } from '../components/Topbar';

import Inicio from './Areas/Inicio';
import Ordenes from './Areas/Ordenes';
import Ensamble from './Areas/Ensamble';
import Pruebas from './Areas/Pruebas';
import Calidad from './Areas/Calidad';
import Empaque from './Areas/Empaque';
import Embarques from './Areas/Embarques';
import Trazabilidad from './Areas/Trazabilidad';
import Turnos from './Areas/Turnos';
import Reportes from './Areas/Reportes';
import Configuracion from './Areas/Configuracion';

export default function Main() {
  const { sesion, cambiarUsuarioSimulado, cerrarSesion } = usePlanta();
  const [vistaActual, setVistaActual] = useState<string>('inicio');

  // Menú táctico industrial completo con las 11 estaciones (P-40..P-43 y flujo de caso)
  const menuItems: MenuItem[] = [
    {
      id: 'inicio',
      code: '00',
      label: 'Telemetría',
      roles: [1, 2, 3, 4, 5, 6, 7, 8, 9],
      component: <Inicio />,
    },
    {
      id: 'ordenes',
      code: '01',
      label: 'Órdenes',
      roles: [RolesEnum.LIDER_LINEA, RolesEnum.SUBGERENTE_PRODUCCION, RolesEnum.GERENTE_PRODUCCION, RolesEnum.GERENTE_PLANTA, RolesEnum.ADMINISTRADOR],
      component: <Ordenes />,
    },
    {
      id: 'ensamble',
      code: '02',
      label: '1. Ensamble',
      roles: [RolesEnum.OPERADOR, RolesEnum.LIDER_LINEA, RolesEnum.SUBGERENTE_PRODUCCION, RolesEnum.GERENTE_PRODUCCION, RolesEnum.ADMINISTRADOR],
      component: <Ensamble />,
    },
    {
      id: 'pruebas',
      code: '03',
      label: '2. Prueba Funcional',
      roles: [RolesEnum.OPERADOR, RolesEnum.LIDER_LINEA, RolesEnum.INSPECTOR_CALIDAD, RolesEnum.ADMINISTRADOR],
      component: <Pruebas />,
    },
    {
      id: 'calidad',
      code: '04',
      label: '3. Calidad',
      roles: [RolesEnum.INSPECTOR_CALIDAD, RolesEnum.GERENTE_PLANTA, RolesEnum.ADMINISTRADOR],
      component: <Calidad />,
    },
    {
      id: 'empaque',
      code: '05',
      label: '4. Empaque',
      roles: [RolesEnum.ALMACEN_EMPAQUE, RolesEnum.SUPERVISOR_ALMACEN, RolesEnum.ADMINISTRADOR],
      component: <Empaque />,
    },
    {
      id: 'embarques',
      code: '06',
      label: '5. Embarques',
      roles: [RolesEnum.ALMACEN_EMPAQUE, RolesEnum.SUPERVISOR_ALMACEN, RolesEnum.GERENTE_PLANTA, RolesEnum.ADMINISTRADOR],
      component: <Embarques />,
    },
    {
      id: 'trazabilidad',
      code: '360',
      label: 'Trazabilidad 360°',
      roles: [1, 2, 3, 4, 5, 6, 7, 8, 9],
      component: <Trazabilidad />,
    },
    {
      id: 'turnos',
      code: '07',
      label: 'Cierre & Autorizaciones',
      roles: [RolesEnum.LIDER_LINEA, RolesEnum.SUPERVISOR_ALMACEN, RolesEnum.SUBGERENTE_PRODUCCION, RolesEnum.GERENTE_PRODUCCION, RolesEnum.GERENTE_PLANTA, RolesEnum.ADMINISTRADOR],
      component: <Turnos />,
    },
    {
      id: 'reportes',
      code: '08',
      label: 'Reportes & Pareto',
      roles: [RolesEnum.LIDER_LINEA, RolesEnum.SUBGERENTE_PRODUCCION, RolesEnum.GERENTE_PRODUCCION, RolesEnum.GERENTE_PLANTA, RolesEnum.ADMINISTRADOR],
      component: <Reportes />,
    },
    {
      id: 'config',
      code: 'SYS',
      label: 'Config / DB',
      roles: [RolesEnum.ADMINISTRADOR],
      component: <Configuracion />,
    },
  ];

  // Si el usuario es Administrador (rol 9), tiene acceso total a todas las estaciones.
  // De lo contrario se filtran por su rol.
  const itemsPermitidos =
    sesion.usuario.id_rol === RolesEnum.ADMINISTRADOR
      ? menuItems
      : menuItems.filter((item) => (item.roles as readonly number[]).includes(sesion.usuario.id_rol));

  return (
    <div className="app-container">
      {/* Topbar táctica con diseño Arknights: Endfield */}
      <Topbar
        sesion={sesion}
        items={itemsPermitidos}
        vistaActual={vistaActual}
        setVistaActual={setVistaActual}
        onCambiarRol={cambiarUsuarioSimulado}
        onCerrarSesion={cerrarSesion}
      />

      {/* Área de trabajo de la estación activa */}
      <main className="main-content tex-grid">
        {menuItems.find((i) => i.id === vistaActual)?.component || <Inicio />}
      </main>
    </div>
  );
}
