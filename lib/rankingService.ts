import { getAppsScriptJson } from "@/lib/appsScriptClient";

export interface StudentRanking {
    name: string;
    avatar: string;
    grade: string;
    classGroup: string;
    points: number;
    mbtiProgress: boolean[];
    poseProgress: boolean[];
}

export interface ClassRanking {
    classGroup: string;
    totalPoints: number;
    averagePoints: number;
    studentCount: number;
}

export async function fetchRankingData(): Promise<StudentRanking[]> {
    try {
        const res = await getAppsScriptJson<{ status: string; data: StudentRanking[] }>(
            new URLSearchParams({ action: "getRankingData" })
        );
        
        if (res.status === "success" && Array.isArray(res.data)) {
            return res.data;
        }
    } catch (err) {
        console.error("Failed to fetch ranking data:", err);
    }
    return [];
}

export function calculateClassRankings(students: StudentRanking[]): ClassRanking[] {
    const classMap: Record<string, { totalPoints: number; studentCount: number }> = {};
    
    students.forEach(s => {
        const className = `${s.grade}학년 ${s.classGroup}반`.trim() || "기타";
        if (!classMap[className]) {
            classMap[className] = { totalPoints: 0, studentCount: 0 };
        }
        classMap[className].totalPoints += s.points;
        classMap[className].studentCount += 1;
    });
    
    const rankings: ClassRanking[] = Object.entries(classMap).map(([classGroup, data]) => ({
        classGroup,
        totalPoints: data.totalPoints,
        averagePoints: Math.round((data.totalPoints / data.studentCount) * 10) / 10,
        studentCount: data.studentCount
    }));
    
    // 평균 점수순 정렬
    return rankings.sort((a, b) => b.averagePoints - a.averagePoints);
}
