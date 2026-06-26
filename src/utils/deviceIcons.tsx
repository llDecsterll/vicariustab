/*
 * COPYRIGHT NOTICE | УВЕДОМЛЕНИЕ ОБ АВТОРСКИХ ПРАВАХ | 版权声明
 * © 2026 Utkin Vladislav Vyacheslavovich (Уткин Владислав Вячеславович)
 * Email: vicariustab@icloud.com | Telegram: https://t.me/Dexterll
 * All rights reserved. Unauthorized copying, modification, distribution or commercial use is prohibited.
 * 保留所有权利。未经版权所有者事先书面同意，禁止复制、修改、分发或商业使用。
 * Все права защищены. Копирование, изменение, распространение и коммерческое использование без письменного согласия правообладателя запрещено.
 * Release
 */
import React from 'react';
import { 
  Laptop, 
  Monitor, 
  Cpu, 
  Keyboard, 
  Mouse, 
  Printer, 
  Video, 
  Camera, 
  Package, 
  HelpCircle 
} from 'lucide-react';
import { ComputerCategory } from '../types';

interface GetDeviceIconProps {
  category: ComputerCategory;
  deviceType?: string;
  model?: string;
  size?: number;
  className?: string;
}

export function getDeviceIcon({
  category,
  deviceType = '',
  model = '',
  size = 16,
  className = ''
}: GetDeviceIconProps): React.ReactNode {
  const normCategory = (category || '').toLowerCase();
  const normType = (deviceType || '').toLowerCase();
  const normModel = (model || '').toLowerCase();

  // Combined checks for keyboard and mouse
  const hasKeyboard = normModel.includes('клавиатур') || normType.includes('клавиатур') || normModel.includes('keyboard');
  const hasMouse = normModel.includes('мыш') || normType.includes('мыш') || normModel.includes('mouse') || normType.includes('мышка') || normModel.includes('мышка');

  // Both Keyboard & Mouse (e.g., Клавиатура + мышь, Комплект)
  if (hasKeyboard && hasMouse) {
    return (
      <span className={`inline-flex items-center gap-0.5 ${className}`}>
        <Keyboard size={size - 1} />
        <Mouse size={size - 2} />
      </span>
    );
  }

  // Keyboard only
  if (hasKeyboard) {
    return <Keyboard size={size} className={className} />;
  }

  // Mouse only
  if (hasMouse) {
    return <Mouse size={size} className={className} />;
  }

  // 1. "Периферия" as Category
  if (normCategory === 'периферия') {
    // defaults for other peripheral
    return <Keyboard size={size} className={className} />;
  }

  // 2. "Оргтехника" - МФУ, принтеры, сканеры, копиры
  if (
    normCategory === 'оргтехника' || 
    normType.includes('принтер') || 
    normType.includes('сканер') || 
    normType.includes('мфу') || 
    normType.includes('копир') ||
    normModel.includes('принтер') || 
    normModel.includes('scan') || 
    normModel.includes('print') || 
    normModel.includes('мфу')
  ) {
    return <Printer size={size} className={className} />;
  }

  // 3. "Видеонаблюдение" - камера, регистратор
  if (
    normCategory === 'видеонаблюдение' || 
    normType.includes('камер') || 
    normType.includes('видео') || 
    normModel.includes('камер') || 
    normModel.includes('camera') || 
    normModel.includes('cctv') || 
    normType.includes('cctv')
  ) {
    return <Video size={size} className={className} />;
  }

  // 4. "Ноутбук"
  if (normCategory === 'ноутбук' || normType.includes('ноутбук') || normModel.includes('laptop') || normModel.includes('macbook')) {
    return <Laptop size={size} className={className} />;
  }

  // 5. "Монитор"
  if (normCategory === 'монитор' || normType.includes('монитор') || normModel.includes('monitor') || normType.includes('дисплей') || normModel.includes('дисплей') || normModel.includes('dell p') || normModel.includes('asus vz')) {
    return <Monitor size={size} className={className} />;
  }

  // 6. "ПК"
  if (normCategory === 'пк' || normType.includes('пк') || normType.includes('компьютер') || normModel.includes('thinkcentre') || normModel.includes('expertcenter')) {
    return <Cpu size={size} className={className} />;
  }

  // 7. "Расходники"
  if (normCategory === 'расходники' || normType.includes('картридж') || normModel.includes('картридж') || normType.includes('чернил')) {
    return <Package size={size} className={className} />;
  }

  // 8. "Другое" / fallback
  return <HelpCircle size={size} className={className} />;
}
