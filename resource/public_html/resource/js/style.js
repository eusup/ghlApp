$(document).ready(function () {
  // 임시: 99popup.html 클릭 시 기본 팝업 확인. 확인 후 제거.
  if (window.location.pathname.split("/").pop() === "99popup.html") {
    $("body").click(function (event) {
      if ($(event.target).closest(".dimmed").length) return;
      openLayerPopup($(".popup-box:not(.book-info)"));
    });
  }

  // 프로필 캐릭터 변경
  $(".myprofile.edit > .con .right .box .chara .flex li .btn").click(function () {
    $(this).parent("li").addClass("act").siblings("li").removeClass("act");
  });

  // 비번 보기
  $(".password-wrap .btn-pw").on("click", function () {
    const $input = $(this).siblings("input");
    const showPassword = $input.attr("type") === "password";
    $input.attr("type", showPassword ? "text" : "password");
    $(this).toggleClass("act", showPassword);
  });

  // 레벨 선택
  $(".myLevel .flex li button").click(function () {
    $(this).closest(".flex").find("li > button").removeClass("act");
    $(this).closest(".flex").find("li > button + span").remove();
    $(this).addClass("act").after("<span>Now</span>");
  });

  // 팝업 닫기 기능 -dimmed 영역 클릭시에도 닫힘
  $(function () {
    $(".popup .btn-close, .dimmed").click(function (event) {
      const isDimmed = $(this).hasClass("dimmed");
      if (isDimmed && event.target !== event.currentTarget) return;

      closeLayerPopup($(".dimmed").children(".popup.act"));
    });
  });

  // 팝업 레벨 범위 선택
  $(".option-type-level").each(function () {
    const $optionLevel = $(this);
    const $inputs = $optionLevel.find("input[type='number']");
    const $range = $optionLevel.find(".range");
    let touchHandleIndex = 0;

    const updateLevel = function (values) {
      $inputs.eq(0).val(values[0]);
      $inputs.eq(1).val(values[1]);
    };

    $range.slider({
      range: true,
      min: 1,
      max: 30,
      values: [1, 30],
      slide: function (event, ui) {
        updateLevel(ui.values);
      },
    });

    $range[0].addEventListener("pointerdown", function (event) {
      if (event.pointerType === "mouse") return;

      const values = $range.slider("values");
      const rect = this.getBoundingClientRect();
      const value = Math.round(1 + ((event.clientX - rect.left) / rect.width) * 29);
      touchHandleIndex = Math.abs(value - values[0]) <= Math.abs(value - values[1]) ? 0 : 1;
      this.setPointerCapture(event.pointerId);
    });

    $range[0].addEventListener("pointermove", function (event) {
      if (event.pointerType === "mouse" || !this.hasPointerCapture(event.pointerId)) return;

      const rect = this.getBoundingClientRect();
      const values = $range.slider("values");
      let value = Math.round(1 + ((event.clientX - rect.left) / rect.width) * 29);
      value = Math.max(1, Math.min(30, value));
      value = touchHandleIndex === 0 ? Math.min(value, values[1]) : Math.max(value, values[0]);
      $range.slider("values", touchHandleIndex, value);
      updateLevel($range.slider("values"));
    });

    $inputs.on("input", function () {
      let minValue = Math.max(1, Math.min(30, Number($inputs.eq(0).val()) || 1));
      let maxValue = Math.max(1, Math.min(30, Number($inputs.eq(1).val()) || 30));

      if (minValue > maxValue) {
        if (this === $inputs[0]) minValue = maxValue;
        else maxValue = minValue;
      }

      $inputs.eq(0).val(minValue);
      $inputs.eq(1).val(maxValue);
      $range.slider("values", [minValue, maxValue]);
    });
  });

  $(".btn-option").on("click", function () {
    const $optionPopup = $(".popup.option");

    if ($optionPopup.hasClass("act")) closeLayerPopup($optionPopup);
    else openLayerPopup($optionPopup);
  });

  // 탭기능
  $(".tab-wrap").each(function () {
    const $tabWrap = $(this);
    const $tabItems = $tabWrap.find("ul li");
    const $tabContents = $tabWrap.nextAll(".tab-contents").first().children();

    const activateTab = function (index) {
      $tabItems.eq(index).addClass("act").siblings("li").removeClass("act");
      $tabContents.eq(index).addClass("act").siblings().removeClass("act");
    };

    $tabWrap.find("ul li button").on("click", function () {
      activateTab($(this).parent("li").index());
    });

    const activeIndex = $tabItems.filter(".act").first().index();
    if (activeIndex >= 0 && $tabContents.length) activateTab(activeIndex);
  });

  // notice 닫기
  $(".notice-wrap .btn-close").click(function () {
    $(".notice-wrap").hide();
  });

  // book info 팝업
  $("button:has(.content-thumb)").click(function () {
    openLayerPopup($(".book-info"));
  });

  // user detail 안내 팝업
  $(function () {
    const $userDetail = $(".user-detail");
    const $dimmed = $(".dimmed");
    const $userDataPopup = $(".home-userData-info");

    $userDetail.find(".user-data-wrap .inner .btn-icnOnly").on("click", function () {
      const userDetailRect = $userDetail[0].getBoundingClientRect();
      const $userDetailClone = $userDetail.clone().addClass("user-detail-clone").css({
        position: "fixed",
        top: userDetailRect.top,
        left: userDetailRect.left,
        width: userDetailRect.width,
        margin: 0,
      });

      $userDetailClone.find(".user-data-wrap .inner .btn-icnOnly").css({
        position: "static",
        transform: "none",
        width: "32px",
        height: "32px",
        marginLeft: "auto",
        borderRadius: 0,
        backgroundColor: "transparent",
      });

      $userDataPopup.find(".user-detail-clone").remove();
      $userDataPopup.prepend($userDetailClone);
      openLayerPopup($userDataPopup);
    });

    $userDataPopup.children(".btn-icnOnly").on("click", function () {
      closeLayerPopup($userDataPopup);
      $userDataPopup.find(".user-detail-clone").remove();
    });
  });

  // 좋아요버튼
  $(".btn-favorite").click(function () {
    $(this).toggleClass("act");
  });

  // 상단 메뉴 셀렉트 열기·닫기
  $(".menu-select > .btn-noStyle").click(function () {
    $(this).siblings(".menu-wrap").toggleClass("act");
  });

  // phonics 페이지 myphonics Description 오픈
  $(".library.phonics .myPhonics .btn-wrap .btn.btn-noStyle").click(function () {
    $(this).toggleClass("act");
  });

  // phonics 스크롤 위치에 따른 상단 nav 상태 변경
  $(window)
    .on("scroll", function () {
      $(".nav-top").toggleClass("act", window.scrollY >= 1);
    })
    .trigger("scroll");

  // 탭
  bottomSheet();

  // 팝업오픈시 스크롤 작동 금지하기위한 변수
  let layerPopupScrollTop = 0;
  let isLayerPopupScrollLocked = false;

  // 팝업 공통 - 팝업과 dimmed 창 act클래스 추가
  function openLayerPopup(popup) {
    const $popup = $(popup);

    if (!isLayerPopupScrollLocked) {
      layerPopupScrollTop = window.scrollY;
      document.body.style.setProperty("--scroll-lock-top", `-${layerPopupScrollTop}px`);
      document.body.classList.add("scroll-lock");
      isLayerPopupScrollLocked = true;
    }

    $(".dimmed").addClass("act");
    $popup.addClass("act");

    if ($popup.filter(".popup.option").length) {
      $(".btn.btn-option").addClass("act");
    }
  }

  // 팝업 공통 - 팝업과 dimmed 창 act클래스 제거
  function closeLayerPopup(popup, skipBookInfoAnimation) {
    const $popup = $(popup);
    const $bookInfo = $popup.filter(".book-info.act");

    const finishCloseLayerPopup = function () {
      $(".dimmed").removeClass("act");
      $popup.removeClass("act closing");

      if ($popup.filter(".popup.option").length) {
        $(".btn.btn-option").removeClass("act");
      }

      if (isLayerPopupScrollLocked) {
        document.body.classList.remove("scroll-lock");
        document.body.style.removeProperty("--scroll-lock-top");
        window.scrollTo(0, layerPopupScrollTop);
        isLayerPopupScrollLocked = false;
      }
    };

    if ($bookInfo.length && !skipBookInfoAnimation) {
      $bookInfo[0].style.removeProperty("animation-name");
      $bookInfo.addClass("closing");
      window.setTimeout(finishCloseLayerPopup, 300);
      return;
    }

    finishCloseLayerPopup();
  }

  // 바텀시트 팝업 방식 - 상단 영역을 아래로 드래그하여 닫기
  function bottomSheet() {
    const dragHandleHeight = 48;

    $(".book-info").each(function () {
      const bottomSheet = this;
      let startY = 0;
      let dragDistance = 0;
      let isDragging = false;

      const startDrag = function (clientY) {
        startY = clientY;
        dragDistance = 0;
        isDragging = true;
        bottomSheet.style.setProperty("animation-name", "none");
        bottomSheet.style.setProperty("transition-property", "none");
        bottomSheet.style.setProperty("user-select", "none");
      };

      const moveDrag = function (clientY) {
        dragDistance = Math.max(0, clientY - startY);
        bottomSheet.style.setProperty("transform", `translate(-50%, ${dragDistance}px)`);
      };

      bottomSheet.addEventListener("pointerdown", function (event) {
        const sheetRect = bottomSheet.getBoundingClientRect();
        const isHandleArea = event.clientY <= sheetRect.top + dragHandleHeight;

        if (event.pointerType === "touch" || event.button !== 0 || !isHandleArea || !bottomSheet.classList.contains("act")) return;

        startDrag(event.clientY);
        bottomSheet.setPointerCapture(event.pointerId);
      });

      bottomSheet.addEventListener("pointermove", function (event) {
        if (!isDragging) return;

        moveDrag(event.clientY);
        event.preventDefault();
      });

      const finishDrag = function (event) {
        if (!isDragging) return;

        isDragging = false;

        if (event.pointerId >= 0 && bottomSheet.hasPointerCapture(event.pointerId)) {
          bottomSheet.releasePointerCapture(event.pointerId);
        }

        const closeDistance = Math.min(120, bottomSheet.offsetHeight * 0.2);
        const shouldClose = dragDistance >= closeDistance;
        const endPosition = shouldClose ? bottomSheet.offsetHeight : 0;
        const slideAnimation = bottomSheet.animate([{ transform: `translate(-50%, ${dragDistance}px)` }, { transform: `translate(-50%, ${endPosition}px)` }], {
          duration: 200,
          easing: shouldClose ? "ease-in" : "ease-out",
          fill: "forwards",
        });

        slideAnimation.finished.then(function () {
          slideAnimation.cancel();
          bottomSheet.style.removeProperty("transform");
          bottomSheet.style.removeProperty("transition-property");
          bottomSheet.style.removeProperty("user-select");

          if (shouldClose) {
            closeLayerPopup($(bottomSheet), true);
            bottomSheet.style.removeProperty("animation-name");
          }
        });
      };

      bottomSheet.addEventListener("pointerup", finishDrag);
      bottomSheet.addEventListener("pointercancel", finishDrag);

      bottomSheet.addEventListener(
        "touchstart",
        function (event) {
          const touch = event.touches[0];
          const sheetRect = bottomSheet.getBoundingClientRect();
          const isHandleArea = touch.clientY <= sheetRect.top + dragHandleHeight;

          if (!isHandleArea || !bottomSheet.classList.contains("act")) return;

          event.preventDefault();
          startDrag(touch.clientY);
        },
        { passive: false },
      );

      bottomSheet.addEventListener(
        "touchmove",
        function (event) {
          if (!isDragging) return;

          event.preventDefault();
          moveDrag(event.touches[0].clientY);
        },
        { passive: false },
      );

      bottomSheet.addEventListener("touchend", function () {
        finishDrag({ pointerId: -1 });
      });

      bottomSheet.addEventListener("touchcancel", function () {
        finishDrag({ pointerId: -1 });
      });
    });
  }
});

// mypage highcharts 영역
$(function () {
  if (!document.getElementById("categoryChart") || typeof Highcharts === "undefined") return;

  var chartFont = "Montserrat";
  var axisColor = "#dfe2f6";
  var labelColor = "#4a4a52";
  var months = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];

  Highcharts.chart("categoryChart", {
    chart: {
      type: "column",
      backgroundColor: "transparent",
      height: 245,
      spacingTop: 12,
      spacingRight: 0,
      spacingBottom: 0,
      spacingLeft: 0,
    },
    title: { text: null },
    credits: { enabled: false },
    legend: { enabled: false },
    tooltip: { enabled: false },
    xAxis: {
      categories: [
        "School",
        "Animals",
        "People<br>&amp; Places",
        "Sports",
        "Art<br>&amp; Culture",
        "Family<br>&amp; Friends",
        "Science<br>&amp; Nature",
        "Community",
        "Health<br>&amp; Wellness",
        "Fun<br>Stories",
        "Phonics",
        "Classics",
      ],
      lineColor: axisColor,
      tickLength: 0,
      labels: {
        useHTML: true,
        autoRotation: [90],
        style: {
          color: labelColor,
          fontFamily: chartFont,
          fontSize: "12px",
          textAlign: "center",
        },
      },
    },
    yAxis: {
      min: 0,
      max: 50,
      tickInterval: 10,
      title: { text: null },
      gridLineColor: axisColor,
      labels: {
        style: {
          color: labelColor,
          fontFamily: chartFont,
          fontSize: "12px",
        },
      },
    },
    plotOptions: {
      column: {
        borderWidth: 0,
        pointPadding: 0.18,
        groupPadding: 0.08,
      },
      series: {
        animation: false,
        colorByPoint: true,
      },
    },
    colors: ["#ff595e", "#ff862d", "#ffca3a", "#72c66c", "#31bce8", "#4d6ee8", "#7f61f2", "#d36ce5", "#10c6c7", "#9bd66f", "#3f4149", "#c8c8c8"],
    series: [
      {
        data: [34, 28, 21, 21, 39, 5, 21, 21, 45, 46, 21, 11],
      },
    ],
  });

  function createTrendChart(container, title, color, data) {
    Highcharts.chart(container, {
      chart: {
        type: "line",
        backgroundColor: "transparent",
        height: 205,
        spacingTop: 4,
        spacingRight: 0,
        spacingBottom: 0,
        spacingLeft: 0,
      },
      title: {
        text: title,
        margin: 4,
        style: {
          color: color,
          fontFamily: chartFont,
          fontSize: "15px",
          fontWeight: "700",
        },
      },
      credits: { enabled: false },
      legend: { enabled: false },
      tooltip: { enabled: false },
      xAxis: {
        categories: months,
        lineColor: axisColor,
        tickLength: 0,
        labels: {
          style: {
            color: labelColor,
            fontFamily: chartFont,
            fontSize: "11px",
          },
        },
      },
      yAxis: {
        min: 0,
        max: 70,
        tickPositions: [0, 30, 40, 50, 60, 70],
        title: { text: null },
        gridLineColor: axisColor,
        labels: {
          style: {
            color: labelColor,
            fontFamily: chartFont,
            fontSize: "11px",
          },
        },
      },
      plotOptions: {
        series: {
          animation: false,
          lineWidth: 1.5,
          marker: {
            enabled: true,
            radius: 3,
            lineWidth: 0,
          },
        },
      },
      series: [
        {
          color: color,
          data: data,
        },
      ],
    });
  }

  createTrendChart("booksTrendChart", "Number of books read", "#ff6b57", [43, 32, 24, 33, 29, 47, 59, 29, 26, 24, 24, 34]);
  createTrendChart("minutesTrendChart", "Minutes read", "#f5a400", [43, 32, 24, 32, 29, 47, 59, 29, 26, 24, 24, 34]);
  createTrendChart("activitiesTrendChart", "Number of activities completed", "#96cf38", [45, 34, 25, 34, 30, 49, 63, 30, 27, 25, 25, 36]);
});
