import type { ManipType, Origin } from '../core/types';
import type { IconName } from '../ui/Txt';

// Icon pastille per manip type (spec §3.5) — shared by home, system and closure screens.
export const MANIP_VISUAL: Record<ManipType, { icon: IconName; tone: 'yellow' | 'mint' | 'teal' }> =
  {
    remise_en_service: { icon: 'bolt', tone: 'mint' },
    verifier_tore: { icon: 'donut-large', tone: 'yellow' },
    rappeler_client: { icon: 'call', tone: 'yellow' },
    changer_module: { icon: 'battery-charging-full', tone: 'teal' },
    verifier_communication: { icon: 'wifi-tethering', tone: 'teal' },
  };

export const ORIGIN_LABEL: Record<Origin, string> = {
  alerte: 'Alerte',
  revolty: 'Revolty',
  installation: 'Installation',
};

export function capitalizeFirst(text: string): string {
  return text.length === 0 ? text : text.charAt(0).toUpperCase() + text.slice(1);
}
