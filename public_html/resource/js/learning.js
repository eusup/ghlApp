$(document).ready(function () {
  // 학습 공통: 완료한 문제의 상단 step 버튼에 .done 추가
  const doneStep = function ($container) {
    const $wrap = $container.closest(".question");
    const index = $wrap.find(".inner").children("[name='container']").index($container);
    $wrap.find(".step-wrap button").eq(index).addClass("done");
  };

  // listening 학습단
  $(".listening.question").each(function () {
    const $wrap = $(this);
    const $containers = $wrap.find(".inner").children("[name='container']");
    const $steps = $wrap.find(".step-wrap button");
    const $audio = $wrap.find(".btn-audio");
    const $submit = $wrap.find(".contents-bottom .btn-big");
    const $prev = $wrap.find(".btn-prev");
    const $next = $wrap.find(".btn-next");

    const getCurrent = function () {
      return $containers.filter(".act");
    };

    // 문제를 모두 고르면(question 영역 버튼 전부 act) Submit 노출, 제출한 문제는 숨김
    const updateSubmit = function () {
      const $current = getCurrent();
      const $words = $current.find(".question-area .btn.word");
      $submit.toggleClass("act", !$current.hasClass("solved") && $words.length > 0 && $words.length === $words.filter(".act").length);
    };

    // 이전/다음 버튼 상태: 첫 문제면 이전 disabled, Submit 후에만 다음 활성화
    const updateDirection = function () {
      const $current = getCurrent();
      $prev.toggleClass("act", $containers.index($current) > 0);
      $next.toggleClass("act", $current.hasClass("solved"));
    };

    // myAnswer 영역 단어 추가/삭제 시 기존 단어들이 새 위치로 미끄러지듯 이동 (FLIP)
    // 변경 전 위치 기록 → 변경 → 이전 위치로 transform 되돌림 → .moving 으로 transition 걸고 원위치
    const flip = function ($list, change) {
      const $items = $list.children("li");
      const before = $items.map(function () {
        return this.getBoundingClientRect();
      }).get();

      change();

      $items.each(function (i) {
        if (!this.isConnected) return;
        const rect = this.getBoundingClientRect();
        const x = before[i].left - rect.left;
        const y = before[i].top - rect.top;
        $(this).removeClass("moving").css("transform", x || y ? "translate(" + x + "px, " + y + "px)" : "");
      });

      $list[0].offsetWidth;
      $items.addClass("moving").css("transform", "");
    };

    // question 영역 버튼 클릭: myAnswer 영역에 클릭 순서대로 추가 / 다시 누르면 제거 (토글)
    $wrap.find(".question-area .btn.word").on("click", function () {
      const $word = $(this);
      const $answerList = $word.closest("[name='container']").find(".answer-area .pill-wrap");

      flip($answerList, function () {
        if ($word.hasClass("act")) {
          $answerList.children("li").filter(function () {
            return $(this).data("source") === $word[0];
          }).remove();
          $word.removeClass("act");
        } else {
          const $item = $("<li></li>").data("source", $word[0]);
          $item.append($word.clone().removeAttr("id").removeClass("act"));
          $answerList.append($item);
          $word.addClass("act");
        }
      });
      updateSubmit();
    });

    // myAnswer 영역 버튼 클릭: 해당 버튼 제거 + question 영역 원본 act 해제
    $wrap.find(".answer-area .pill-wrap").on("click", ".btn.word", function () {
      const $item = $(this).closest("li");
      flip($item.parent(), function () {
        $($item.data("source")).removeClass("act");
        $item.remove();
      });
      updateSubmit();
    });

    // 초기화 버튼: myAnswer 비우고 question 영역 act 해제
    $wrap.find(".btn-reset").on("click", function () {
      const $container = $(this).closest("[name='container']");
      $container.find(".answer-area .pill-wrap").empty();
      $container.find(".question-area .btn.word").removeClass("act");
      updateSubmit();
    });

    // 음원 재생 <음원 시간을 임의로 2s 라고 작성하였습니다.>
    // 클릭 시 재생/일시정지 토글, 일시정지 후 다시 누르면 남은 시간부터 이어서 재생
    const audioDuration = 2000;
    let audioRemain = audioDuration;
    let audioStart = 0;
    let audioTimer;

    const playAudio = function () {
      audioStart = Date.now();
      $audio.addClass("playing");
      audioTimer = window.setTimeout(function () {
        $audio.removeClass("playing");
        audioRemain = audioDuration;
      }, audioRemain);
    };

    const pauseAudio = function () {
      window.clearTimeout(audioTimer);
      audioRemain = Math.max(0, audioRemain - (Date.now() - audioStart));
      $audio.removeClass("playing");
    };

    const resetAudio = function () {
      window.clearTimeout(audioTimer);
      audioRemain = audioDuration;
      $audio.removeClass("playing");
    };

    // 상단 지시문 클릭: 안내 음원 처음부터 재생, 문제 음원은 일시정지 / 스피커 클릭 시 안내 음원 정지 + 초기화
    const $instruction = $wrap.find(".questionInfo");
    const instructionAudio = $wrap.find(".audio-instruction")[0];

    const stopInstruction = function () {
      if (!instructionAudio) return;
      instructionAudio.pause();
      instructionAudio.currentTime = 0;
      $instruction.removeClass("playing");
    };

    $instruction.on("click", function () {
      if (!instructionAudio) return;
      if ($audio.hasClass("playing")) pauseAudio();
      instructionAudio.currentTime = 0;
      instructionAudio.play();
      $instruction.addClass("playing");
    });

    $(instructionAudio).on("ended", function () {
      $instruction.removeClass("playing");
    });

    $audio.on("click", function () {
      stopInstruction();
      if ($audio.hasClass("playing")) {
        pauseAudio();
      } else {
        playAudio();
      }
    });

    // 정/오답 표시: 실사이트와 동일하게 container 첫번째 자식으로 .result 추가 (정답 .pass.green / 오답 .non.red)
    // 한 번 추가되면 남아 있어서 제출한 문제로 돌아와도 그대로 보임
    const showResult = function ($container, isCorrect) {
      const $result = $("<div class='result'></div>").addClass(isCorrect ? "pass green" : "non red");
      $result.append($("<img>").attr({
        src: "../public_html/resource/images/learning/" + (isCorrect ? "img-correct.svg" : "img-wrong.svg"),
        alt: isCorrect ? "correct" : "wrong"
      }));
      $result.append($("<p></p>").text($container.data("answer") || ""));
      $container.prepend($result);
    };

    // Submit: 정/오답 표시 후 다음 버튼 활성화, 문제당 1회만 제출 (.solved 후 단어/초기화 잠금)
    // 정답은 container 의 data-answer 값과 비교 (임시, 실제 채점은 개발 영역)
    $submit.on("click", function () {
      const $current = getCurrent();
      if ($current.hasClass("solved")) return;
      const answer = $current.find(".answer-area .btn.word").map(function () {
        return $(this).val();
      }).get().join(" ");

      showResult($current, answer === ($current.data("answer") || ""));

      $current.addClass("solved");
      doneStep($current);
      resetAudio();
      updateSubmit();
      updateDirection();
    });

    // 이전/다음 문제 이동, 마지막 문제에서 다음 누르면 결과 페이지로 이동
    // 아직 제출 안 한 문제로 이동하면 음원 자동 재생, 제출한 문제는 재생 안 함
    const moveTo = function (index) {
      if (index >= $containers.length) {
        window.location.href = "listening+results.html";
        return;
      }
      $containers.removeClass("act").eq(index).addClass("act");
      $steps.removeClass("act").eq(index).addClass("act");
      stopInstruction();
      resetAudio();
      if (!getCurrent().hasClass("solved")) playAudio();
      updateSubmit();
      updateDirection();
    };

    // 진입 시 첫 문제 음원 자동 재생
    playAudio();

    $prev.on("click", function () {
      moveTo($containers.index(getCurrent()) - 1);
    });

    $next.on("click", function () {
      moveTo($containers.index(getCurrent()) + 1);
    });
  });

  // thinking 학습단
  $(".thinking.question").each(function () {
    const $wrap = $(this);
    const $containers = $wrap.find(".inner").children("[name='container']");
    const $steps = $wrap.find(".step-wrap button");
    const $prev = $wrap.find(".btn-prev");
    const $next = $wrap.find(".btn-next");
    const $toast = $wrap.find(".toast");
    const maxLength = 50;
    let toastTimer;

    const getCurrent = function () {
      return $containers.filter(".act");
    };

    // 공백 제외 글자 수
    const getLength = function ($textarea) {
      return $textarea.val().replace(/\s/g, "").length;
    };

    // 이전/다음 버튼 상태: 첫 문제면 이전 disabled, 미입력 또는 50자 초과면 다음 disabled
    const updateDirection = function () {
      const $current = getCurrent();
      const length = getLength($current.find("textarea"));
      $prev.toggleClass("act", $containers.index($current) > 0);
      $next.toggleClass("act", length > 0 && length <= maxLength);
    };

    // toast: 노출 2.5초(등장 애니메이션 0.5초 포함) 후 내려감
    // 노출 중 다시 호출되면 애니메이션 재생 없이 노출 시간만 초기화
    // 내려갈 때 .hide 로 등장 애니메이션 반전 재생(0.5초) 후 act 제거
    const hideToast = function () {
      window.clearTimeout(toastTimer);
      if (!$toast.hasClass("act")) return;
      $toast.addClass("hide");
      toastTimer = window.setTimeout(function () {
        $toast.removeClass("act hide");
      }, 500);
    };

    const showToast = function () {
      window.clearTimeout(toastTimer);
      $toast.removeClass("hide").addClass("act");
      toastTimer = window.setTimeout(hideToast, 2500);
    };

    // textarea 입력: 높이 자동 조절 + 글자 수 표시
    // 50자 초과 상태에서 입력하면 toast 노출 (노출 중이면 시간 초기화, 내려간 뒤면 다시 노출)
    // 입력 제한: 영문/숫자/일부 기호/공백만 허용, 한글·이모지 등은 자동 삭제 (실사이트 정규식 그대로)
    $wrap.find(".answer-write textarea").on("input", function () {
      const $textarea = $(this);
      const value = $textarea.val();
      const filtered = value.replace(/[^a-zA-Z0-9,.<>\/?;':"\[\]{}!@#$%^&*()_+-=\|\\\s]+/g, "");
      if (filtered !== value) $textarea.val(filtered);
      const length = getLength($textarea);

      this.style.height = "auto";
      this.style.height = this.scrollHeight + "px";

      $textarea.siblings(".count").children("span").text(length);
      if (length > maxLength) showToast();
      updateDirection();
    });

    // 이전/다음 문제 이동, 마지막 문제에서 다음 누르면 결과 페이지로 이동
    const moveTo = function (index) {
      if (index >= $containers.length) {
        window.location.href = "thinking+results.html";
        return;
      }
      $containers.removeClass("act").eq(index).addClass("act");
      $steps.removeClass("act").eq(index).addClass("act");
      hideToast();
      updateDirection();
    };

    $prev.on("click", function () {
      moveTo($containers.index(getCurrent()) - 1);
    });

    // 다음: 현재 문제 step 완료 표시 후 이동 (실사이트: 답안 저장 후 다음 문제)
    $next.on("click", function () {
      doneStep(getCurrent());
      moveTo($containers.index(getCurrent()) + 1);
    });
  });

  // quiz 학습단
  $(".quiz.question").each(function () {
    const $wrap = $(this);
    const $containers = $wrap.find(".inner").children("[name='container']");
    const $steps = $wrap.find(".step-wrap button");
    const $prev = $wrap.find(".btn-prev");
    const $next = $wrap.find(".btn-next");

    const getCurrent = function () {
      return $containers.filter(".act");
    };

    // 이전/다음 버튼 상태: 첫 문제면 이전 disabled, 보기 선택 후에만 다음 활성화
    const updateDirection = function () {
      const $current = getCurrent();
      $prev.toggleClass("act", $containers.index($current) > 0);
      $next.toggleClass("act", $current.find(".btn.option.act").length > 0);
    };

    // 보기 클릭: 같은 문제 안에서 하나만 선택
    $wrap.find(".option-list .btn.option").on("click", function () {
      const $option = $(this);
      $option.closest(".option-list").find(".btn.option").removeClass("act");
      $option.addClass("act");
      updateDirection();
    });

    // 이전/다음 문제 이동, 마지막 문제에서 다음 누르면 결과 페이지로 이동
    const moveTo = function (index) {
      if (index >= $containers.length) {
        window.location.href = "quiz+results.html";
        return;
      }
      $containers.removeClass("act").eq(index).addClass("act");
      $steps.removeClass("act").eq(index).addClass("act");
      updateDirection();
    };

    $prev.on("click", function () {
      moveTo($containers.index(getCurrent()) - 1);
    });

    // 다음: 현재 문제 step 완료 표시 후 이동 (실사이트: 답 저장 후 다음 문제)
    $next.on("click", function () {
      doneStep(getCurrent());
      moveTo($containers.index(getCurrent()) + 1);
    });
  });

  // quiz 결과: Review Answers 클릭 시 정답 리스트 열림, X 클릭 시 닫힘
  $(".quiz.results").each(function () {
    const $wrap = $(this);
    const $review = $wrap.find(".review");

    $wrap.find(".btn-review").on("click", function () {
      $review.addClass("act");
    });

    $review.find(".btn-close").on("click", function () {
      $review.removeClass("act");
    });
  });

  // 학습 공통: 상단 X 클릭 시 나가기 팝업 노출, 팝업 X / No 클릭 시 닫힘 (Ok 링크는 추후 매핑)
  $(".wrap > .top .btn-close").on("click", function () {
    $(this).closest(".wrap").find(".dimmed:has(.popup-exit)").addClass("act");
  });

  $(".dimmed .top .btn-close, .popup-exit .btn-no").on("click", function () {
    $(this).closest(".dimmed").removeClass("act");
  });

  // 학습 공통 결과: OK 클릭 시 학습 완료 팝업 노출
  $(".results .btn-done").on("click", function () {
    $(this).closest(".wrap").find(".dimmed:has(.popup-done)").addClass("act");
  });
});
