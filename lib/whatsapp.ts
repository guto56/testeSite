import { project } from '@/data/project';

export function whatsappLink(message: string) {
  return `https://wa.me/${project.whatsapp}?text=${encodeURIComponent(message)}`;
}

export function aptWhatsappMessage(id: string, floor: number) {
  return `Olá! Tenho interesse no apartamento ${id} (${floor}º andar) do ${project.name}. Pode me passar mais informações?`;
}
