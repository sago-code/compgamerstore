import { FieldValue } from "firebase/firestore";

export interface User {
    uid: string;
    photo: string;
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    age: number;
    document_type: string;
    document_number: string;
    departament: string;
    municipality: string;
    direction: string;
    role: string;
    phone: number;
    created_at?: Date | FieldValue;
    updated_at?: Date | FieldValue;
    deleted_at?: Date | FieldValue | null;
}