import { db } from './firebase';
import { collection, addDoc, serverTimestamp, query, getDocs, deleteDoc } from 'firebase/firestore';

const months = [
  '2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06',
  '2025-07', '2025-08', '2025-09', '2025-10', '2025-11', '2025-12',
  '2026-01', '2026-02', '2026-03'
];

// DATA FOR SITTAX (Corrected: This is the one ending in 1246)
const dataSittax = {
  active: [781, 878, 923, 981, 983, 1021, 1039, 1145, 1185, 1208, 1247, 1237, 1234, 1246, 1246],
  new: [43, 55, 50, 55, 52, 57, 101, 94, 102, 99, 109, 49, 80, 92, 0],
  req: [42, 42, 49, 56, 37, 43, 69, 32, 84, 110, 80, 61, 68, 65, 12],
  canc: [32, 32, 50, 53, 29, 47, 41, 59, 42, 60, 27, 47, 62, 63, 14],
  auto: [21, 7, 12, 8, 13, 18, 15, 17, 19, 0, 21, 21, 28, 10, 2],
  inact: [67, 28, 40, 48, 63, 71, 44, 65, 60, 65, 87, 87, 90, 64, 0],
  mrr: [445614.47, 500959.68, 526635.29, 559728.3, 560869.43, 582551.06, 592821.3, 653301.63, 657939.11, 692354, 720902, 752546, 743252, 758113, 758113],
  lostCanc: [26719.45, 18753, 34152.8, 35019.65, 26942.75, 39261.44, 35542.5, 44685.76, 53475.25, 45341.59, 25270.35, 34639.08, 45183.4, 37467.8, 8599],
  lostInat: [34556, 14151.65, 20863.15, 24470.3, 36395.8, 37953.12, 26270.75, 43556.17, 35487.5, 51710.88, 50915.85, 45856, 47419, 35221, 0]
};

// DATA FOR OPENIX (Corrected: This is the one ending in 787)
const dataOpenix = {
  active: [144, 192, 264, 329, 345, 431, 466, 564, 639, 607, 732, 745, 778, 787, 787],
  new: [34, 32, 45, 27, 21, 76, 83, 74, 92, 99, 70, 45, 88, 58, 0],
  req: [10, 6, 17, 10, 13, 18, 32, 14, 33, 38, 39, 22, 58, 40, 8],
  canc: [9, 4, 16, 11, 13, 17, 23, 21, 17, 28, 15, 18, 45, 30, 13],
  auto: [3, 7, 5, 6, 7, 8, 6, 10, 5, 11, 13, 15, 18, 10, 0],
  inact: [4, 11, 13, 11, 23, 19, 19, 29, 26, 33, 40, 46, 75, 41, 0],
  mrr: [80640, 107520, 147840, 184240, 193200, 247093.6, 260960, 315840, 335426.86, 327401, 375816, 397069, 396980, 415798, 415798],
  lostCanc: [5462.25, 6597.5, 9962, 9243.25, 8561, 12220.65, 15779, 16555.78, 18426.1, 17357.5, 14462.5, 19816.95, 24319.94, 21086.6, 7000.05],
  lostInat: [1608, 5694.5, 6197.25, 5531, 10995.25, 10308.25, 8094.75, 15573.65, 12540, 16784.78, 21646.1, 24917, 25190, 20099, 0]
};

async function seed() {
  console.log('Iniciando correção final de dados...');

  // Limpar dados existentes
  const productsSnap = await getDocs(collection(db, 'products'));
  for (const doc of productsSnap.docs) {
    await deleteDoc(doc.ref);
  }
  const recordsSnap = await getDocs(collection(db, 'records'));
  for (const doc of recordsSnap.docs) {
    await deleteDoc(doc.ref);
  }

  // Criar Produtos
  const sittaxRef = await addDoc(collection(db, 'products'), {
    name: 'Sittax',
    description: 'Sistema de gestão tributária',
    createdAt: serverTimestamp()
  });

  const openixRef = await addDoc(collection(db, 'products'), {
    name: 'Openix',
    description: 'Plataforma de automação',
    createdAt: serverTimestamp()
  });

  const advEasyRef = await addDoc(collection(db, 'products'), {
    name: 'AdvEasy',
    description: 'Gestão jurídica simplificada',
    createdAt: serverTimestamp()
  });

  // Adicionar Registros para SITTAX
  for (let i = 0; i < months.length; i++) {
    await addDoc(collection(db, 'records'), {
      productId: sittaxRef.id,
      date: months[i],
      activeClientsPrevious: dataSittax.active[i],
      newContracts: dataSittax.new[i],
      cancellationRequests: dataSittax.req[i],
      cancelledInMonth: dataSittax.canc[i],
      autoCancellations: dataSittax.auto[i],
      inactivationsInMonth: dataSittax.inact[i],
      totalMRR: dataSittax.mrr[i],
      lostMRRCancel: dataSittax.lostCanc[i],
      lostMRRInact: dataSittax.lostInat[i]
    });
  }

  // Adicionar Registros para OPENIX
  for (let i = 0; i < months.length; i++) {
    await addDoc(collection(db, 'records'), {
      productId: openixRef.id,
      date: months[i],
      activeClientsPrevious: dataOpenix.active[i],
      newContracts: dataOpenix.new[i],
      cancellationRequests: dataOpenix.req[i],
      cancelledInMonth: dataOpenix.canc[i],
      autoCancellations: dataOpenix.auto[i],
      inactivationsInMonth: dataOpenix.inact[i],
      totalMRR: dataOpenix.mrr[i],
      lostMRRCancel: dataOpenix.lostCanc[i],
      lostMRRInact: dataOpenix.lostInat[i]
    });
  }

  console.log('Correção concluída com sucesso!');
}

seed().catch(console.error);
