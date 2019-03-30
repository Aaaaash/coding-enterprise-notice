
interface ICodingStorage {
  frequency: number | string;
  checked: string[];
}

interface IStorage {
  "CODING-ENTERPRISE-NOTICE-STORAGE": ICodingStorage;
}
