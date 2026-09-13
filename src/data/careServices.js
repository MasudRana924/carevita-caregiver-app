/** Dummy care services for booking flow */
export const CARE_SERVICES = [
  {
    id: 'hospital_companion',
    title: 'Hospital Companion',
    description:
      'Accompany to hospital, attend appointments, take notes and report back to family.',
    priceLabel: 'From ৳800/visit',
    price: 800,
    priceUnit: 'visit',
    icon: 'business-outline',
    badge: 'Most Booked',
    category: 'caregiver',
  },
  {
    id: 'caregiver',
    title: 'Elderly Support',
    description:
      'Companionship, meals and daily activity support for elderly family members.',
    priceLabel: 'From ৳500/hr',
    price: 500,
    priceUnit: 'hr',
    icon: 'heart-outline',
    category: 'caregiver',
  },
  {
    id: 'nurse',
    title: 'Nurse Care',
    description:
      'Qualified nursing, medication, wound care and vital monitoring at home.',
    priceLabel: 'From ৳1,500/session',
    price: 1500,
    priceUnit: 'session',
    icon: 'medkit-outline',
    category: 'nurse',
  },
  {
    id: 'physio',
    title: 'Physiotherapy',
    description:
      'Licensed physiotherapist for home visits, recovery and rehabilitation.',
    priceLabel: 'From ৳1,200/session',
    price: 1200,
    priceUnit: 'session',
    icon: 'fitness-outline',
    category: 'physio',
  },
  {
    id: 'autistic',
    title: 'Disability / Special Child',
    description:
      'Trained caregivers for children or adults with special needs.',
    priceLabel: 'From ৳800/session',
    price: 800,
    priceUnit: 'session',
    icon: 'happy-outline',
    category: 'autistic',
  },
  {
    id: 'helping_hand',
    title: 'Helping Hand',
    description: 'Errands, shopping, bill payments and everyday assistance.',
    priceLabel: 'From ৳400/hr',
    price: 400,
    priceUnit: 'hr',
    icon: 'hand-left-outline',
    category: 'caregiver',
  },
  {
    id: 'day_care',
    title: 'Day Care',
    description: 'Full daytime care and companionship, 9 am to 5 pm.',
    priceLabel: 'From ৳2,000/day',
    price: 2000,
    priceUnit: 'day',
    icon: 'sunny-outline',
    category: 'caregiver',
  },
  {
    id: 'night_care',
    title: 'Night Care',
    description: 'Overnight caregiver for safety and comfort, 8 pm to 8 am.',
    priceLabel: 'From ৳2,500/night',
    price: 2500,
    priceUnit: 'night',
    icon: 'moon-outline',
    category: 'caregiver',
  },
];

export const getServiceById = id =>
  CARE_SERVICES.find(service => service.id === id) || null;
