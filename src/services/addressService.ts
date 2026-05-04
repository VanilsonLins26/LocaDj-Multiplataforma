import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, writeBatch } from 'firebase/firestore';
import { auth, db } from '../config/firebaseConfig';
import { Address, CreateAddressDTO } from '../types/address';

// Helper para obter a referência da coleção de endereços do usuário logado
function getUserAddressesCollection() {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('Usuário não autenticado');
  // Usamos uma subcoleção 'addresses' dentro do documento do usuário
  return collection(db, 'users', currentUser.uid, 'addresses');
}

export const addressService = {
  async listAddresses(): Promise<Address[]> {
    const addressesRef = getUserAddressesCollection();
    const q = query(addressesRef);
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Address));
  },

  async createAddress(address: CreateAddressDTO): Promise<Address> {
    const addressesRef = getUserAddressesCollection();
    
    // Se este for marcado como principal, desmarca os outros
    if (address.isPrimary) {
      await this.clearPrimaryAddresses();
    }

    const docRef = await addDoc(addressesRef, address);
    return {
      id: docRef.id,
      ...address
    };
  },

  async updateAddress(id: string, address: Partial<CreateAddressDTO>): Promise<Address> {
    const addressesRef = getUserAddressesCollection();
    const docRef = doc(addressesRef, id);
    
    if (address.isPrimary) {
      await this.clearPrimaryAddresses();
    }

    await updateDoc(docRef, address);
    
    // Simplificamos o retorno apenas mesclando o ID com os dados parciais (na prática, você pode buscar o doc atualizado)
    return { id, ...address } as Address;
  },

  async deleteAddress(id: string): Promise<void> {
    const addressesRef = getUserAddressesCollection();
    const docRef = doc(addressesRef, id);
    await deleteDoc(docRef);
  },

  async setPrimary(id: string): Promise<void> {
    const addressesRef = getUserAddressesCollection();
    
    // Primeiro limpa todos os principais
    await this.clearPrimaryAddresses();
    
    // Em seguida, define o novo como principal
    const docRef = doc(addressesRef, id);
    await updateDoc(docRef, { isPrimary: true });
  },

  // Helper interno para garantir que só exista um endereço principal
  async clearPrimaryAddresses(): Promise<void> {
    const addressesRef = getUserAddressesCollection();
    const snapshot = await getDocs(addressesRef);
    
    const batch = writeBatch(db);
    snapshot.docs.forEach(document => {
      if (document.data().isPrimary) {
        batch.update(document.ref, { isPrimary: false });
      }
    });
    
    await batch.commit();
  }
};
