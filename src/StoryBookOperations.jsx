import { useEffect, useMemo, useState } from "react";

const STORE_STYLES = {
  pizza: {
    label: "피자는 치즈빨",
    card: "bg-yellow-100 border-yellow-300",
    badge: "bg-yellow-300 text-zinc-900",
  },
  gogi: {
    label: "고기지",
    card: "bg-pink-100 border-pink-300",
    badge: "bg-pink-300 text-zinc-900",
  },
  all: {
    label: "통합",
    card: "bg-white border-zinc-300",
    badge: "bg-zinc-200 text-zinc-900",
  },
};

const TASKS_API_PATH = "/api/tasks";

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    ...options,
  });

  if (!response.ok) {
    let message = "요청 처리에 실패했습니다.";

    try {
      const data = await response.json();
      if (data?.message) {
        message = data.message;
      }
    } catch {
      // Ignore invalid JSON error payloads.
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

function TopNav({ page, setPage }) {
  const items = [
    { id: "dashboard", label: "대시보드" },
    { id: "story", label: "스토리북" },
    { id: "manual", label: "스토리북 메뉴얼" },
  ];

  return (
    <div className="sticky top-0 z-30 w-full border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-[2200px] items-center justify-between px-10 py-4">
        <div>
          <p className="text-lg font-bold">스토리북 시스템</p>
          <p className="text-xs text-zinc-500">Operation Program</p>
        </div>

        <div className="flex items-center gap-3">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                page === item.id
                  ? "bg-black text-white"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function getDashboardAnalysis(tasks) {
  if (tasks.length === 0) {
    return {
      percent: 0,
      status: "안전",
      summary: "업무가 아직 등록되지 않았습니다.",
      delayed: [],
      strengths: ["현재 등록된 업무가 없어 리스크가 발생하지 않은 상태입니다."],
      weaknesses: ["운영 판단을 위한 데이터가 없습니다."],
      solutions: ["스토리북에서 업무를 먼저 등록하세요."],
      priorities: [],
    };
  }

  const percent = Math.round(
    tasks.reduce((sum, task) => sum + (task.percent ?? 0), 0) / tasks.length
  );

  const delayed = tasks
    .filter((task) => (task.percent ?? 0) < 50)
    .sort((a, b) => (a.percent ?? 0) - (b.percent ?? 0));

  let status = "안전";
  if (tasks.length > 0 && percent < 40) status = "위험";
  else if (tasks.length > 0 && percent < 70) status = "주의";

  const strengths = [];
  const weaknesses = [];
  const solutions = [];

  if (percent >= 70) {
    strengths.push("전체 평균 진행률이 높아 운영 흐름이 안정적입니다.");
  } else {
    strengths.push("업무가 기록되고 있어 운영 상태를 추적할 수 있습니다.");
  }

  if (delayed.length > 0) {
    weaknesses.push(`진행률 50% 미만 업무가 ${delayed.length}건 존재합니다.`);
    solutions.push("지연 업무부터 우선순위로 재배치하고 담당자 일정을 재조정하세요.");
  } else {
    weaknesses.push("현재 지연 업무는 확인되지 않습니다.");
    solutions.push("현재 운영 흐름을 유지하며 퍼센티지와 메모를 계속 기록하세요.");
  }

  if (tasks.some((task) => !task.memo || !task.memo.trim())) {
    weaknesses.push("메모가 비어 있는 업무가 있어 세부 진행 상황 파악이 약합니다.");
    solutions.push("업무별 메모를 기록해 문제 발생 원인과 다음 액션을 남기세요.");
  }

  const priorities = delayed.slice(0, 5);

  return {
    percent,
    status,
    summary:
      status === "위험"
        ? "지연 업무가 누적되어 우선순위 재정리가 필요한 상태입니다."
        : status === "주의"
        ? "운영은 진행 중이지만 일부 업무를 먼저 처리해야 합니다."
        : "전반적으로 안정적인 운영 상태입니다.",
    delayed,
    strengths,
    weaknesses,
    solutions,
    priorities,
  };
}

function Dashboard({ tasks }) {
  const analysis = useMemo(() => getDashboardAnalysis(tasks), [tasks]);

  return (
    <div className="h-full overflow-y-auto p-10">
      <h1 className="text-3xl font-black">운영 대시보드</h1>

      <div className="mt-8 grid grid-cols-2 gap-6">
        <div className="rounded-[1.5rem] border border-zinc-200 bg-white p-6">
          <p className="text-sm text-zinc-500">전체 업무 진행률</p>
          <div className="mt-4 h-6 overflow-hidden rounded-full bg-zinc-200">
            <div className="h-full bg-black" style={{ width: `${analysis.percent}%` }} />
          </div>
          <p className="mt-3 text-2xl font-bold">{analysis.percent}%</p>
        </div>

        <div className="rounded-[1.5rem] border border-zinc-200 bg-white p-6">
          <p className="text-sm text-zinc-500">현재 운영 상황</p>
          <p className="mt-2 text-2xl font-bold">{analysis.status}</p>
          <p className="mt-3 text-sm text-zinc-700">{analysis.summary}</p>
          {tasks.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-500">업무가 없습니다. 업무를 추가하세요.</p>
          ) : (
            <div className="mt-4 space-y-2">
              {analysis.priorities.length === 0 ? (
                <p className="text-sm text-green-700">우선 처리할 지연 업무가 없습니다.</p>
              ) : (
                analysis.priorities.map((task, index) => (
                  <div key={task.id} className="rounded-xl bg-red-50 p-3 text-sm">
                    <p className="font-semibold">우선순위 {index + 1}</p>
                    <p>{task.title}</p>
                    <p className="text-zinc-600">{task.owner} · {task.percent ?? 0}%</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="rounded-[1.25rem] bg-red-100 p-4 text-sm">
          <p className="font-bold">위험</p>
          <p className="mt-2">0~39%</p>
          <p className="mt-1 text-zinc-700">지연 업무가 많아 즉시 재정리가 필요합니다.</p>
        </div>
        <div className="rounded-[1.25rem] bg-yellow-100 p-4 text-sm">
          <p className="font-bold">주의</p>
          <p className="mt-2">40~69%</p>
          <p className="mt-1 text-zinc-700">핵심 업무를 먼저 처리해야 하는 구간입니다.</p>
        </div>
        <div className="rounded-[1.25rem] bg-green-100 p-4 text-sm">
          <p className="font-bold">안전</p>
          <p className="mt-2">70~100%</p>
          <p className="mt-1 text-zinc-700">정상 운영 상태이며 현재 흐름 유지가 가능합니다.</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-6">
        <div className="rounded-[1.5rem] border border-zinc-200 bg-white p-6">
          <p className="font-semibold">장점</p>
          <div className="mt-3 space-y-2 text-sm text-zinc-700">
            {analysis.strengths.map((item, idx) => (
              <p key={idx}>• {item}</p>
            ))}
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-zinc-200 bg-white p-6">
          <p className="font-semibold">문제점</p>
          <div className="mt-3 space-y-2 text-sm text-zinc-700">
            {analysis.weaknesses.map((item, idx) => (
              <p key={idx}>• {item}</p>
            ))}
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-zinc-200 bg-white p-6">
          <p className="font-semibold">해결방안</p>
          <div className="mt-3 space-y-2 text-sm text-zinc-700">
            {analysis.solutions.map((item, idx) => (
              <p key={idx}>• {item}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ManualPage() {
  return (
    <div className="p-10">
      <h1 className="text-3xl font-black">스토리북 메뉴얼</h1>
      <div className="mt-8 rounded-[1.5rem] border border-zinc-200 bg-white p-8">
        <p className="text-lg font-semibold">추후 작성 예정</p>
        <p className="mt-2 text-sm text-zinc-600">운영 방식과 업무 처리 기준을 이 페이지에 정리할 예정입니다.</p>
      </div>
    </div>
  );
}

function DatePickerModal({
  isOpen,
  title,
  year,
  month,
  startDay,
  endDay,
  onClose,
  onApply,
}) {
  const [tempYear, setTempYear] = useState(year);
  const [tempMonth, setTempMonth] = useState(month);
  const [rangeStart, setRangeStart] = useState(startDay);
  const [rangeEnd, setRangeEnd] = useState(endDay);

  useEffect(() => {
    if (!isOpen) return;
    setTempYear(year);
    setTempMonth(month);
    setRangeStart(startDay);
    setRangeEnd(endDay);
  }, [endDay, isOpen, month, startDay, year]);

  if (!isOpen) return null;

  const daysInMonth = new Date(tempYear, tempMonth, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const goPrevMonth = () => {
    setTempMonth((prevMonth) => {
      if (prevMonth === 1) {
        setTempYear((prevYear) => prevYear - 1);
        return 12;
      }
      return prevMonth - 1;
    });
  };

  const goNextMonth = () => {
    setTempMonth((prevMonth) => {
      if (prevMonth === 12) {
        setTempYear((prevYear) => prevYear + 1);
        return 1;
      }
      return prevMonth + 1;
    });
  };

  const handleDayClick = (day) => {
    if (rangeStart === null || (rangeStart !== null && rangeEnd !== null)) {
      setRangeStart(day);
      setRangeEnd(null);
      return;
    }

    if (rangeStart !== null && rangeEnd === null) {
      if (day < rangeStart) {
        setRangeStart(day);
        setRangeEnd(rangeStart);
      } else {
        setRangeEnd(day);
      }
    }
  };

  const isSelected = (day) => {
    if (rangeStart === null) return false;
    if (rangeEnd === null) return day === rangeStart;
    return day >= rangeStart && day <= rangeEnd;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
      <div className="w-[760px] rounded-[2rem] bg-white p-8 shadow-2xl">
        <div className="flex items-center justify-between">
          <button
            onClick={goPrevMonth}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-xl"
          >
            ‹
          </button>
          <div className="text-center">
            <p className="text-lg font-bold">{tempYear}년 {tempMonth}월</p>
            <p className="mt-1 text-sm text-zinc-500">업무: {title}</p>
          </div>
          <button
            onClick={goNextMonth}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-xl"
          >
            ›
          </button>
        </div>

        <div className="mt-8 grid grid-cols-7 gap-3 text-center text-sm text-zinc-500">
          {["일", "월", "화", "수", "목", "금", "토"].map((label) => (
            <p key={label}>{label}</p>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-7 gap-3">
          {days.map((day) => (
            <button
              key={day}
              onClick={() => handleDayClick(day)}
              className={`h-12 rounded-full text-sm font-medium transition ${
                isSelected(day)
                  ? "bg-black text-white"
                  : "bg-white text-zinc-800 hover:bg-zinc-100"
              }`}
            >
              {day}
            </button>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={() => {
              setRangeStart(null);
              setRangeEnd(null);
            }}
            className="text-sm font-semibold text-zinc-700"
          >
            초기화
          </button>
          <div className="flex gap-3">
            <button onClick={onClose} className="rounded-xl border border-zinc-300 px-5 py-3 text-sm font-semibold">
              취소
            </button>
            <button
              onClick={() => {
                if (rangeStart !== null) {
                  onApply({
                    year: tempYear,
                    month: tempMonth,
                    startDay: rangeStart,
                    endDay: rangeEnd ?? rangeStart,
                  });
                }
              }}
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white"
            >
              적용
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ModalAddTask({ close, addTask, year, month }) {
  const [rows, setRows] = useState(
    Array.from({ length: 5 }, () => ({
      title: "",
      owner: "",
      store: "pizza",
      year,
      month,
      startDay: 1,
      endDay: 1,
      memo: "",
      percent: 0,
    }))
  );
  const [pickerRowIndex, setPickerRowIndex] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const updateRow = (index, field, value) => {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  };

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      { title: "", owner: "", store: "pizza", year, month, startDay: 1, endDay: 1, memo: "", percent: 0 },
    ]);
  };

  const saveRows = async () => {
    const nextRows = rows.filter((row) => row.title.trim() && row.owner.trim());

    if (nextRows.length === 0) {
      setError("저장할 업무가 없습니다. 업무명과 담당자를 입력하세요.");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      await Promise.all(
        nextRows.map((row) =>
          addTask({
            ...row,
            year: row.year ?? year,
            month: row.month ?? month,
          })
        )
      );
      close();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-6">
        <div className="flex h-[86vh] w-[620px] flex-col rounded-[2rem] bg-white p-8 shadow-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">업무 업데이트</h2>
            <button onClick={close} className="rounded-xl border border-zinc-300 px-4 py-2 text-sm">
              닫기
            </button>
          </div>

          <div className="mt-6 flex-1 space-y-4 overflow-y-auto pr-1">
            {rows.map((row, index) => (
              <div key={index} className="rounded-[1.25rem] border border-zinc-200 p-4">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    value={row.title}
                    onChange={(e) => updateRow(index, "title", e.target.value)}
                    placeholder="업무 내용"
                    className="rounded-xl border border-zinc-300 p-3 text-sm"
                  />
                  <input
                    value={row.owner}
                    onChange={(e) => updateRow(index, "owner", e.target.value)}
                    placeholder="담당자"
                    className="rounded-xl border border-zinc-300 p-3 text-sm"
                  />
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPickerRowIndex(index)}
                    className="rounded-xl border border-zinc-300 p-3 text-left text-sm"
                  >
                    기간 설정: {row.year}.{row.month} {row.startDay}~{row.endDay}일
                  </button>
                  <select
                    value={row.store}
                    onChange={(e) => updateRow(index, "store", e.target.value)}
                    className="rounded-xl border border-zinc-300 p-3 text-sm"
                  >
                    <option value="pizza">피자는 치즈빨</option>
                    <option value="gogi">고기지</option>
                    <option value="all">통합</option>
                  </select>
                </div>
              </div>
            ))}
          </div>

          {error ? <p className="mt-4 text-sm font-medium text-red-600">{error}</p> : null}

          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              onClick={addRow}
              disabled={isSaving}
              className="rounded-xl border border-zinc-300 p-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            >
              + 업무 추가
            </button>
            <button
              onClick={saveRows}
              disabled={isSaving}
              className="rounded-xl bg-black p-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              저장
            </button>
          </div>
        </div>
      </div>

      {pickerRowIndex !== null && (
        <DatePickerModal
          isOpen={pickerRowIndex !== null}
          title={rows[pickerRowIndex].title || "업무"}
          year={rows[pickerRowIndex].year ?? year}
          month={rows[pickerRowIndex].month ?? month}
          startDay={rows[pickerRowIndex].startDay}
          endDay={rows[pickerRowIndex].endDay}
          onClose={() => setPickerRowIndex(null)}
          onApply={({ year: nextYear, month: nextMonth, startDay, endDay }) => {
            updateRow(pickerRowIndex, "year", nextYear);
            updateRow(pickerRowIndex, "startDay", startDay);
            updateRow(pickerRowIndex, "endDay", endDay);
            updateRow(pickerRowIndex, "month", nextMonth);
            setPickerRowIndex(null);
          }}
        />
      )}
    </>
  );
}

function ModalTaskDetail({ task, close, updateTask, deleteTask, year, month }) {
  const [percent, setPercent] = useState(task.percent ?? 0);
  const [memo, setMemo] = useState(task.memo ?? "");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setPercent(task.percent ?? 0);
    setMemo(task.memo ?? "");
  }, [task]);

  const handleSave = async () => {
    setIsSaving(true);
    setError("");

    try {
      await updateTask(task.id, {
        percent: Math.min(100, Math.max(0, percent)),
        memo,
      });
      close();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsSaving(true);
    setError("");

    try {
      await deleteTask(task.id);
      close();
    } catch (deleteError) {
      setError(deleteError.message);
      setIsSaving(false);
    }
  };

  const handleDateApply = async ({ year: nextYear, month: nextMonth, startDay, endDay }) => {
    setIsSaving(true);
    setError("");

    try {
      await updateTask(task.id, {
        year: nextYear,
        month: nextMonth,
        startDay,
        endDay,
      });
      setPickerOpen(false);
    } catch (updateError) {
      setError(updateError.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-6">
        <div className="w-[520px] rounded-[2rem] bg-white p-8 shadow-2xl">
          <h2 className="text-2xl font-bold">업무 설정</h2>

          <div className="mt-5 rounded-[1.25rem] border border-zinc-200 p-4">
            <p className="text-sm text-zinc-500">담당자</p>
            <p className="mt-1 font-semibold">{task.owner}</p>
            <p className="mt-4 text-sm text-zinc-500">업무</p>
            <p className="mt-1 font-semibold">{task.title}</p>
            <p className="mt-4 text-sm text-zinc-500">현재 기간</p>
            <p className="mt-1 font-semibold">{task.startDay}~{task.endDay}일</p>
          </div>

          <div className="mt-5 space-y-4">
            <button
              onClick={() => setPickerOpen(true)}
              className="w-full rounded-xl border border-zinc-300 p-3 text-sm font-semibold"
            >
              요일 변경
            </button>

            <div>
              <p className="mb-2 text-sm text-zinc-500">진행률 (%)</p>
              <input
                type="number"
                min={0}
                max={100}
                value={percent}
                onChange={(e) => setPercent(Number(e.target.value))}
                className="w-full rounded-xl border border-zinc-300 p-3 text-sm"
              />
            </div>

            <div>
              <p className="mb-2 text-sm text-zinc-500">메모</p>
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                className="min-h-[120px] w-full rounded-xl border border-zinc-300 p-3 text-sm"
              />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="rounded-xl bg-black p-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              저장
            </button>
            <button
              onClick={handleDelete}
              disabled={isSaving}
              className="rounded-xl bg-red-500 p-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              삭제
            </button>
            <button
              onClick={close}
              disabled={isSaving}
              className="rounded-xl border border-zinc-300 p-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            >
              닫기
            </button>
          </div>

          {error ? <p className="mt-4 text-sm font-medium text-red-600">{error}</p> : null}
        </div>
      </div>

      <DatePickerModal
        isOpen={pickerOpen}
        title={task.title}
        year={year}
        month={task.month ?? month}
        startDay={task.startDay}
        endDay={task.endDay}
        onClose={() => setPickerOpen(false)}
        onApply={handleDateApply}
      />
    </>
  );
}

function StoryBookPage({ tasks, addTask, updateTask, deleteTask }) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [showAdd, setShowAdd] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? null;

  const daysInMonth = new Date(year, month, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const firstDayIndex = new Date(year, month - 1, 1).getDay();
  const calendarCells = [
    ...Array.from({ length: firstDayIndex }, (_, i) => ({ type: "empty", id: `e-${i}` })),
    ...days.map((day) => ({ type: "day", day, id: `d-${day}` })),
  ];

  while (calendarCells.length % 7 !== 0) {
    calendarCells.push({ type: "empty", id: `tail-${calendarCells.length}` });
  }

  const weeks = [];
  for (let i = 0; i < calendarCells.length; i += 7) {
    weeks.push(calendarCells.slice(i, i + 7));
  }

  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-y-auto p-12 max-w-[2200px] mx-auto w-full">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-black">스토리북</h1>

          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (month === 1) {
                  setMonth(12);
                  setYear((prev) => prev - 1);
                } else {
                  setMonth((prev) => prev - 1);
                }
              }}
              className="rounded-xl border border-zinc-300 px-3 py-2"
            >
              ◀
            </button>
            <p className="font-bold">{year}년 {month}월</p>
            <button
              onClick={() => {
                if (month === 12) {
                  setMonth(1);
                  setYear((prev) => prev + 1);
                } else {
                  setMonth((prev) => prev + 1);
                }
              }}
              className="rounded-xl border border-zinc-300 px-3 py-2"
            >
              ▶
            </button>
            <button
              onClick={() => setShowAdd(true)}
              className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white"
            >
              업무 업데이트
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-4 text-center text-sm text-zinc-500">
          {["일", "월", "화", "수", "목", "금", "토"].map((label) => (
            <p key={label}>{label}</p>
          ))}
        </div>

        <div className="mt-4 space-y-5">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 gap-4">
              {week.map((cell) => {
                if (cell.type === "empty") {
                  return <div key={cell.id} className="min-h-[360px] rounded-[1.5rem] bg-transparent" />;
                }

                const dayTasks = tasks
                  .filter(
                    (task) =>
                      task.year === year &&
                      task.month === month &&
                      cell.day >= task.startDay &&
                      cell.day <= task.endDay
                  )
                  .slice(0, 10);

                return (
                  <div key={cell.id} className="min-h-[360px] rounded-[1.5rem] border border-zinc-200 bg-white p-4">
                    <p className="mb-3 font-bold">{cell.day}</p>
                    <div className="space-y-2">
                      {dayTasks.length === 0 ? (
                        <p className="text-sm text-zinc-400">업무 없음</p>
                      ) : (
                        dayTasks.map((task) => {
                          const style = STORE_STYLES[task.store] || STORE_STYLES.all;
                          return (
                            <button
                              key={`${task.id}-${cell.day}`}
                              onClick={() => setSelectedTaskId(task.id)}
                              className={`w-full rounded-[1rem] border p-3 text-left text-sm ${style.card}`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${style.badge}`}>
                                  {style.label}
                                </span>
                                <span className="text-[11px] font-semibold text-zinc-700">{task.percent ?? 0}%</span>
                              </div>
                              <p className="mt-2 font-bold text-zinc-900 text-[15px]">{task.title}</p>
                              <p className="mt-1 text-zinc-700 text-[13px]">담당: {task.owner}</p>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {showAdd && <ModalAddTask close={() => setShowAdd(false)} addTask={addTask} year={year} month={month} />}

      {selectedTask && (
        <ModalTaskDetail
          task={selectedTask}
          close={() => setSelectedTaskId(null)}
          updateTask={updateTask}
          deleteTask={deleteTask}
          year={year}
          month={month}
        />
      )}
    </div>
  );
}

export default function StoryBookOperations() {
  const [page, setPage] = useState("dashboard");
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadTasks = async ({ silent = false } = {}) => {
      if (!silent && isMounted) {
        setIsLoading(true);
      }

      try {
        const nextTasks = await requestJson(TASKS_API_PATH);
        if (isMounted) {
          setTasks(nextTasks);
          setError("");
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadTasks();

    const intervalId = window.setInterval(() => {
      loadTasks({ silent: true });
    }, 15000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const addTask = async (task) => {
    const createdTask = await requestJson(TASKS_API_PATH, {
      method: "POST",
      body: JSON.stringify(task),
    });

    setTasks((prev) => [...prev, createdTask]);
    setError("");
    return createdTask;
  };

  const updateTask = async (id, data) => {
    const updatedTask = await requestJson(`${TASKS_API_PATH}/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });

    setTasks((prev) => prev.map((task) => (task.id === id ? updatedTask : task)));
    setError("");
    return updatedTask;
  };

  const deleteTask = async (id) => {
    await requestJson(`${TASKS_API_PATH}/${id}`, {
      method: "DELETE",
    });

    setTasks((prev) => prev.filter((task) => task.id !== id));
    setError("");
  };

  return (
    <div className="flex h-screen flex-col bg-zinc-50 text-zinc-900 w-full">
      <TopNav page={page} setPage={setPage} />

      <div className="flex-1 overflow-hidden overflow-y-auto">
        {error ? (
          <div className="mx-auto mt-6 max-w-[2200px] rounded-2xl border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-sm font-semibold text-zinc-500">
            데이터를 불러오는 중입니다.
          </div>
        ) : null}
        {!isLoading && page === "dashboard" && <Dashboard tasks={tasks} />}
        {!isLoading && page === "story" && <StoryBookPage tasks={tasks} addTask={addTask} updateTask={updateTask} deleteTask={deleteTask} />}
        {!isLoading && page === "manual" && <ManualPage />}
      </div>
    </div>
  );
}
