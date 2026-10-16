import { useState } from 'react';
import { RolesEnum } from '../types/database';
import { usePlanta } from '../context/PlantaContext';

import Topbar from '../components/Topbar';
import Inicio from './Areas/Inicio';
import Ensamble from './Areas/Ensamble';
import Calidad from './Areas/Calidad';
import Empaque from './Areas/Empaque';
import Reportes from './Areas/Reportes';
import Embarques from './Areas/Embarques';
import Configuracion from './Areas/Configuracion';

export default function Main() {
  const { sesion, cambiarUsuarioSimulado, cerrarSesion } = usePlanta();
  const [vistaActual, setVistaActual] = useState<string>('inicio');

  // Menú dinámico según los roles reales de la base de datos con Google Material Symbols:
  const menuItems = [
    {
      id: 'inicio',
      label: 'Telemetría',
      icon: 'analytics',
      roles: [RolesEnum.OPERADOR, RolesEnum.INSPECTOR_CALIDAD, RolesEnum.SUPERVISOR, RolesEnum.GERENTE, RolesEnum.ADMINISTRADOR],
      component: <Inicio />,
    },
    {
      id: 'ensamble',
      label: '1. Ensamble',
      icon: 'precision_manufacturing',
      roles: [RolesEnum.OPERADOR, RolesEnum.SUPERVISOR, RolesEnum.ADMINISTRADOR],
      component: <Ensamble />,
    },
    {
      id: 'calidad',
      label: '2. Calidad',
      icon: 'fact_check',
      roles: [RolesEnum.INSPECTOR_CALIDAD, RolesEnum.SUPERVISOR, RolesEnum.ADMINISTRADOR],
      component: <Calidad />,
    },
    {
      id: 'empaque',
      label: '3. Empaque',
      icon: 'inventory_2',
      roles: [RolesEnum.OPERADOR, RolesEnum.SUPERVISOR, RolesEnum.ADMINISTRADOR],
      component: <Empaque />,
    },
    {
      id: 'embarques',
      label: '4. Embarques',
      icon: 'local_shipping',
      roles: [RolesEnum.SUPERVISOR, RolesEnum.GERENTE, RolesEnum.ADMINISTRADOR],
      component: <Embarques />,
    },
    {
      id: 'reportes',
      label: 'Reportes & Métricas',
      icon: 'monitoring',
      roles: [RolesEnum.SUPERVISOR, RolesEnum.GERENTE, RolesEnum.ADMINISTRADOR],
      component: <Reportes />,
    },
    {
      id: 'config',
      label: 'Configuración / DB',
      icon: 'settings_suggest',
      roles: [RolesEnum.ADMINISTRADOR],
      component: <Configuracion />,
    },
  ];

  // Filtramos los items basándonos en el rol del usuario actual
  const itemsPermitidos = menuItems.filter((item) =>
    (item.roles as readonly number[]).includes(sesion.usuario.id_rol)
  );

  return (
    <div className="app-container">
      {/* Topbar unificada con información de sesión y selector de rol de pruebas */}
      <Topbar
        sesion={sesion}
        items={itemsPermitidos}
        vistaActual={vistaActual}
        setVistaActual={setVistaActual}
        onCambiarRol={cambiarUsuarioSimulado}
        onCerrarSesion={cerrarSesion}
      />

      {/* Área de trabajo de la estación activa */}
      <main className="main-content">
        {menuItems.find((i) => i.id === vistaActual)?.component}
      </main>
    </div>
  );
}
