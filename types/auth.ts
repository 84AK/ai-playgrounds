export interface UserProfile {
    name: string;
    school: string;
    grade?: string | number;
    classGroup?: string | number;
    password?: string;
    avatar: string;
    feedback?: string;
    role?: "admin" | "super_admin" | "student"; 
}
