import { getAppsScriptJson } from "@/lib/appsScriptClient";

export interface StudentRanking {
    name: string;
    avatar: string;
    grade: string;
    classGroup: string;
    points: number;
    progress: boolean[];
    mbtiProgress?: boolean[];
    poseProgress?: boolean[];
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
            // [V8.3] GAS V5.2 대응: mbtiProgress + poseProgress 병합 처리
            const mappedData = res.data.map((item: any) => ({
                ...item,
                progress: item.progress || [...(item.mbtiProgress || []), ...(item.poseProgress || [])]
            }));

            // 점수 내림차순 정렬
            return mappedData.sort((a, b) => {
                const pA = Number(a.points) || 0;
                const pB = Number(b.points) || 0;
                return pB - pA;
            });
        }
    } catch (err) {
        console.error("Failed to fetch ranking data:", err);
    }
    return [];
}

export function calculateClassRankings(students: StudentRanking[]): ClassRanking[] {
    const classMap: Record<string, { totalPoints: number; studentCount: number }> = {};
    
    students.forEach(s => {
        let className = "소속 미입력";
        if (s.grade && s.classGroup && s.grade.toString().trim() !== "" && s.classGroup.toString().trim() !== "") {
            className = `${s.grade}학년 ${s.classGroup}반`.trim();
        }
        
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
