# 작업 로그: 회원가입 중복 (동일 인물) 방어 시스템 강화 (2026-03-19)

## 📌 문제 발생 및 원인 분석
**현상:** 구글 계정이나 별도의 고유 인증 수단 없이 "이름"을 기반으로 로그인/가입을 처리하는 시스템에서 똑같은 이름(ex: 원선우)을 가진 유저가 두 명 이상 중복 저장되는 현상이 발생했습니다.

**원인:** `components/GlobalAuthGuard.tsx` 내 초기 회원 정보 입력 1단계 폼(이름, 학교, 학년, 반, 비밀번호) 입력 시에는 중복이 차단되고 있었으나, **최종 2단계인 캐릭터(아바타) 선택 완료 후 `handleCompleteSignUp` 함수 실행 단계**에서 중복 체크가 누락되어 있었습니다. 
1단계를 동시에 통과하거나, 네트워크 지연으로 인해 1단계 우회 후 바로 2단계를 진행했을 때 앱스 스크립트가 그대로 저장해버리는 취약점이 있었습니다.

---

## 🛠 해결 방안 (수정 내역)
**적용 대상:** `components/GlobalAuthGuard.tsx` 내 `handleCompleteSignUp` 함수

최종 `registerUser(payload)` API를 호출하여 구글 스프레드시트에 영구 저장하기 직전에 `fetchUserProfile` 함수를 한 번 더 호출하는 **이중 방어 로직**을 추가했습니다. 

### 수정 코드 스니펫
```typescript
try {
    // 🛡️ 이중 방어 로직: 최종 등록 전 한 번 더 해당 이름이 존재하는지 검사
    const existingProfile = await fetchUserProfile(formData.name).then((profile) => ({
        status: "success" as const,
        data: profile,
    })).catch(() => ({
        status: "error" as const,
        data: null,
    }));

    if (existingProfile.status === "success" && existingProfile.data) {
        setAlertMessage("가입 진행 중 다른 사용자가 같은 이름으로 등록했습니다. 다른 이름을 사용해주세요!");
        setIsLoading(false);
        return;
    }

    // 🚀 실제 가입 진행
    await registerUser(payload);
    // ... 기존 상태 처리
```

### 💡 기대 효과
- 캐릭터 선택 창까지 넘어간 유저라도, '연구소 입장하기' 버튼을 누른 순간 서버(구글 시트)에 동일한 이름이 이미 등록되어 있다면 가입이 차단됩니다.
- 가입 처리 도중 네트워크 간 지연에서 발생하는 `Race Condition` 중복 문제를 프론트엔드 단에서 강력하게 사전 차단합니다. 

---

_Written by 이 연구소의 자랑스러운 **서기(Scribe)**_
