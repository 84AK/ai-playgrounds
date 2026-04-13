/**
 * Notion API 연동 유틸리티 (Vanilla Fetch 사용)
 */

export interface NotionPageRow {
    id: string;
    title: string;
    content: string;
    track: string;
    week: number;
}

/**
 * 노션 데이터베이스에서 특정 트랙/주차의 컨텐츠를 가져옵니다.
 */
export async function getNotionCourseContent(apiKey: string, databaseId: string, track: string, week: number) {
    if (!apiKey || !databaseId) return null;

    try {
        console.log(`🚀 [Notion] Starting fetch for Track:${track}, Week:${week}`);

        // 1. 데이터베이스의 모든 페이지 가져오기 (필터 없이)
        // 수업 데이터는 양이 적으므로(보통 100개 미만) 전체 로드 후 로컬 필터링이 가장 확실함
        const queryRes = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Notion-Version": "2022-06-28",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({}) // 필터 없이 전체 조회
        });

        if (!queryRes.ok) {
            const err = await queryRes.json();
            console.error("❌ [Notion] DB Query Error:", err);
            return null;
        }

        const queryData = await queryRes.json();
        const results = queryData.results || [];
        console.log(`🔍 [Notion] Total ${results.length} pages found in DB. Filtering...`);

        // 2. 로컬 필터링 (대소문자 무시, 공백 제거, 타입 유연성 확보)
        const targetPage = results.find((page: any) => {
            const p = page.properties;
            
            // Track 찾기 (대소문자 상관없이 매칭)
            const pTrack = (p.Track?.rich_text?.[0]?.plain_text || p.track?.rich_text?.[0]?.plain_text || "").trim().toUpperCase();
            
            // Week 찾기 (숫자든 문자든 상관없이 매칭)
            const pWeekObj = p.Week || p.week;
            let pWeek = "";
            if (pWeekObj?.type === "number") pWeek = pWeekObj.number.toString();
            else if (pWeekObj?.rich_text) pWeek = pWeekObj.rich_text[0]?.plain_text || "";
            else if (pWeekObj?.select) pWeek = pWeekObj.select.name || "";
            
            const isTrackMatch = pTrack === track.toUpperCase().trim();
            const isWeekMatch = pWeek.trim() === week.toString().trim();

            return isTrackMatch && isWeekMatch;
        });

        if (!targetPage) {
            console.warn(`⚠️ [Notion] No match found after local filtering for Track:${track.toUpperCase()} Week:${week}`);
            // 디버깅을 위해 첫 번째 행의 실제 값 출력
            if (results.length > 0) {
                const first = results[0].properties;
                console.log(`💡 [Notion] First row sample - Track: "${first.Track?.rich_text?.[0]?.plain_text}", Week: "${first.Week?.rich_text?.[0]?.plain_text}"`);
            }
            return null;
        }

        const pageId = targetPage.id;
        const props = targetPage.properties;
        const title = props.Title?.title?.[0]?.plain_text || props.제목?.title?.[0]?.plain_text || "무제";
        
        console.log(`✅ [Notion] Match found! Page ID: ${pageId}, Title: ${title}`);

        // 3. 페이지 본문 블록 가져오기
        const blocksRes = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Notion-Version": "2022-06-28"
            }
        });

        if (!blocksRes.ok) return { title, content: "본문을 불러오지 못했습니다." };

        const blocksData = await blocksRes.json();
        const markdown = blocksToMarkdown(blocksData.results);

        return {
            title,
            content: markdown
        };
    } catch (error) {
        console.error("❌ [Notion] Unexpected API Error:", error);
        return null;
    }
}

/**
 * 노션 데이터베이스에서 모든 트랙/주차 정보를 가져와 커리큘럼 구조를 생성합니다.
 */
export async function getNotionCourseStructure(apiKey: string, databaseId: string): Promise<any[]> {
    if (!apiKey || !databaseId) return [];

    try {
        const queryRes = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Notion-Version": "2022-06-28",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({})
        });

        if (!queryRes.ok) return [];

        const queryData = await queryRes.json();
        const results = queryData.results || [];

        return results.map((page: any) => {
            const p = page.properties;
            
            // Track 추출
            const track = (p.Track?.rich_text?.[0]?.plain_text || p.track?.rich_text?.[0]?.plain_text || "MBTI").trim().toUpperCase();
            
            // Week 추출
            const pWeekObj = p.Week || p.week;
            let week = 1;
            if (pWeekObj?.type === "number") week = pWeekObj.number;
            else if (pWeekObj?.rich_text) week = parseInt(pWeekObj.rich_text[0]?.plain_text || "1");
            else if (pWeekObj?.select) week = parseInt(pWeekObj.select.name || "1");

            // Title 추출
            const title = p.Title?.title?.[0]?.plain_text || p.제목?.title?.[0]?.plain_text || `${week}차시`;

            return {
                track,
                week,
                title
            };
        }).sort((a: any, b: any) => {
            // 트랙별, 주차별 정렬
            if (a.track !== b.track) return a.track.localeCompare(b.track);
            return a.week - b.week;
        });
    } catch (error) {
        console.error("❌ [Notion] Structure Fetch Error:", error);
        return [];
    }
}

/**
 * 노션의 rich_text 배열을 마크다운 문자열로 변환합니다.
 */
function richTextToMarkdown(richText: any[]): string {
    if (!richText) return "";
    return richText.map((t: any) => {
        let text = t.plain_text;
        if (t.annotations) {
            const { bold, italic, strikethrough, code, color } = t.annotations;
            if (bold) text = `**${text}**`;
            if (italic) text = `*${text}*`;
            if (strikethrough) text = `~~${text}~~`;
            if (code) text = `\`${text}\``;
            // underline은 마크다운 표준에 없으므로 생략하거나 <u> 사용
        }
        if (t.href) {
            text = `[${text}](${t.href})`;
        }
        return text;
    }).join("");
}

/**
 * 노션 블록들을 마크다운으로 변환 (심플 버전)
 */
function blocksToMarkdown(blocks: any[]): string {
    return blocks.map(block => {
        const type = block.type;
        const value = block[type];
        if (!value) return "";

        // rich_text가 없는 블록(divider 등) 처리
        const text = value.rich_text ? richTextToMarkdown(value.rich_text) : "";

        switch (type) {
            case "heading_1": return `# ${text}\n\n`;
            case "heading_2": return `## ${text}\n\n`;
            case "heading_3": return `### ${text}\n\n`;
            case "paragraph": return `${text}\n\n`;
            case "bulleted_list_item": return `* ${text}\n`;
            case "numbered_list_item": return `1. ${text}\n`;
            case "to_do": return `${value.checked ? "- [x]" : "- [ ]"} ${text}\n`;
            case "code": 
                const codeText = value.rich_text.map((t: any) => t.plain_text).join("");
                return `\`\`\`${value.language}\n${codeText}\n\`\`\`\n\n`;
            case "quote": return `> ${text}\n\n`;
            case "callout": 
                const icon = value.icon?.emoji || "💡";
                return `> ${icon} **${text}**\n\n`;
            case "toggle": 
                return `<details>\n<summary>${text}</summary>\n\n(내용은 노션 원본을 확인해주세요)\n\n</details>\n\n`;
            case "divider": return `---\n\n`;
            case "image": 
                const imgUrl = value.external?.url || value.file?.url;
                const caption = value.caption ? richTextToMarkdown(value.caption) : "";
                return `![${caption || "Image"}](${imgUrl})\n${caption ? `*${caption}*` : ""}\n\n`;
            case "video":
                const videoUrl = value.external?.url || value.file?.url;
                return `[🎥 비디오 보기](${videoUrl})\n\n`;
            case "bookmark":
            case "link_preview":
                return `[🔗 ${value.url}](${value.url})\n\n`;
            default: 
                return "";
        }
    }).join("");
}
