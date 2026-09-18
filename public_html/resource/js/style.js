$(document).ready(function () {
  // 레벨테스트에서 음원 재생 버튼 <음원 시간을 임의로 1s 라고 작성하였습니다.>
  $(".btn-sound").on("click", function () {
    const $button = $(this);
    window.clearTimeout($button.data("soundTimer"));
    $button.addClass("act");
    $button.data(
      "soundTimer",
      window.setTimeout(function () {
        $button.removeClass("act").removeData("soundTimer");
      }, 1000),
    );
  });

  // 레벨테스트에서 results 페이지 2초 후 로딩 팝업과 해당 dimmed 삭제
  const $loadingCovers = $(".popup.loadingCover");
  if ($loadingCovers.length) {
    window.setTimeout(function () {
      for (let i = 0; i < $loadingCovers.length; i++) {
        const $loadingCover = $loadingCovers.eq(i);
        const $dimmed = $loadingCover.closest(".dimmed");
        $dimmed.addClass("fadeOutRadial");
      }
    }, 2000);
  }

  // reward 페이지 로드 완료 3초 후 탭 안내 숨김
  const hideTapInfo = function () {
    window.setTimeout(function () {
      $(".reward.rewardDetail .tap-info").removeClass("act");
    }, 3000);
  };
  if ($(".reward.rewardDetail .tap-info").length) {
    if (document.readyState === "complete") hideTapInfo();
    else $(window).one("load", hideTapInfo);
  }

  // 하단 메뉴 순서: Home, Library, My Profile, Reward
  $(".wrap").each(function () {
    const $wrap = $(this);
    const $navItems = $wrap.children("nav.nav-bottom").children("ul").children("li");
    const pageClasses = ["home", "library", "mypage", "reward"];

    $navItems.removeClass("act");
    for (let i = 0; i < pageClasses.length; i++) {
      if ($wrap.children("." + pageClasses[i]).length) {
        $navItems.eq(i).addClass("act");
        break;
      }
    }

    // 선택 메뉴는 레벨 아이콘, 미선택 메뉴는 기본 nav 아이콘 사용
    const levelClass = ($wrap.attr("class") || "").match(/\blv\d+_\d+\b/);
    const activeIconType = levelClass ? levelClass[0] : "default";
    const navIconNames = ["home", "library", "user", "reward", "down"];
    const activeIconNames = ["home", "library", "myProfile", "reward", "download"];

    $navItems.each(function (index) {
      if (!navIconNames[index]) return;
      const $item = $(this);
      const $image = $item.children("a").children("img");
      const isActive = $item.hasClass("act");
      const iconType = isActive ? activeIconType : "nav";
      const iconName = isActive ? activeIconNames[index] : navIconNames[index];
      const src = $image.attr("src");
      if (src) $image.attr("src", src.replace(/[^/]+$/, "icn-" + iconType + "-" + iconName + ".svg"));
    });
  });

  // 보상 카드: 클릭으로 앞뒤 전환
  $(".reward.rewardDetail .flip-card").on("click", function () {
    $(this).find(".tap-info").removeClass("act");
    if ($(this).hasClass("flipping")) return;
    $(this)
      .addClass("flipping")
      .find(".flip-inner")
      .one("animationend", function () {
        $(this).parent().removeClass("flipping");
      });
    $(this).addClass("turned").toggleClass("flipped");
  });

  // 새 캐릭터 선택 상태 확인용
  $(".reward.rewardDetail .btn-friend").on("click", function () {
    $(this).addClass("act").attr("aria-pressed", "true").text("Reading Friend Selected");
  });

  // select 윈도우 높이에 따라 노출위치 변경
  $(".firstLogin .select .val").click(function () {
    const selectRect = $(this).closest(".select")[0].getBoundingClientRect();
    const viewport = window.visualViewport;
    const viewportMiddle = viewport ? viewport.offsetTop + viewport.height / 2 : window.innerHeight / 2;

    $(this)
      .siblings(".selectBorn")
      .toggleClass("open-up", selectRect.top + selectRect.height / 2 > viewportMiddle)
      .toggleClass("act");
  });

  // select 선택 항목 텍스트 반영
  $(".select ul.selectBorn li").click(function () {
    $(this).parent("ul.selectBorn").siblings(".val").text($(this).text());
    $(this).parent("ul.selectBorn").removeClass("act");
  });

  // 임시: 99popup.html 클릭 시 기본 팝업 확인. 확인 후 제거.
  if (window.location.pathname.split("/").pop() === "99popup.html") {
    $("body").click(function (event) {
      if ($(event.target).closest(".dimmed").length) return;
      openLayerPopup($(".popup-box"));
    });
  }

  // 프로필 캐릭터 변경
  $(".chara .flex li .btn")
    .not(".step2 .chara .flex li .btn")
    .click(function () {
      $(this).parent("li").addClass("act").siblings("li").removeClass("act");
    });

  // 프로필 캐릭터 변경
  $(".step2 .chara .flex li .btn").click(function () {
    $(this).parent("li").toggleClass("act");
  });

  // 첫 로그인: 선택 여부에 따라 Next 버튼 상태 변경
  $(".firstLogin")
    .has(".chara")
    .each(function () {
      const $firstLogin = $(this);
      const updateNextButton = function () {
        $firstLogin.find(".con > .btn-wrap > a.btn").toggleClass("disabled", !$firstLogin.find(".chara .flex li.act").length);
      };

      updateNextButton();
      $firstLogin.find(".chara .flex li .btn").click(updateNextButton);
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

  // 카테고리 All: 현재 탭의 개별 항목만 체크 해제
  $(".popup.option .option-type-category .category-wrap label.pill").on("click", function () {
    $(this).closest(".category-wrap").find("input[type='checkbox']").prop("checked", false);
  });

  // 탭기능
  $(".tab-wrap").each(function () {
    const $tabWrap = $(this);
    const $tabItems = $tabWrap.find("ul li");
    const $tabContents = $tabWrap.nextAll(".tab-contents").first().children();
    const isSupportTab = $tabWrap.closest(".mypage.support").length > 0;

    const activateTab = function (index) {
      $tabItems.eq(index).addClass("act").siblings("li").removeClass("act");
      if (isSupportTab) {
        $tabContents.removeClass("act");
        if (index === 0) $tabContents.addClass("act");
        else $tabContents.eq(index - 1).addClass("act");
        return;
      }
      $tabContents.eq(index).addClass("act").siblings().removeClass("act");
    };

    $tabWrap.find("ul li button").on("click", function () {
      activateTab($(this).parent("li").index());
    });

    const activeIndex = $tabItems.filter(".act").first().index();
    if (activeIndex >= 0 && $tabContents.length) activateTab(activeIndex);
  });

  $(".mypage.support .tab-contents > ul > li > button").on("click", function () {
    $(this).parent("li").toggleClass("act");
  });

  // notice 노출 및 닫기
  const $notice = $(".notice-wrap");
  if ($notice.length) {
    $notice.each(function () {
      const notice = this;
      let animation;
      const collapsed = {
        height: "0px",
        paddingTop: "0px",
        paddingBottom: "0px",
        marginBottom: "0px",
        borderTopWidth: "0px",
        borderBottomWidth: "0px",
        opacity: 0,
      };

      const animateNotice = function (open) {
        if (open) notice.classList.add("act");
        const style = window.getComputedStyle(notice);
        const current = {};
        Object.keys(collapsed).forEach(function (property) {
          current[property] = style[property];
        });
        if (animation) animation.cancel();

        animation = notice.animate(open ? [collapsed, current] : [current, collapsed], { duration: 300 });
        notice.classList.add("animating");
        animation.onfinish = function () {
          if (!open) notice.classList.remove("act");
          notice.classList.remove("animating");
          animation = null;
        };
      };

      $(notice)
        .find(".btn-close")
        .click(function () {
          animateNotice(false);
        });

      const showNotice = function () {
        window.setTimeout(function () {
          animateNotice(true);
        }, 800);
      };

      if (document.readyState === "complete") showNotice();
      else $(window).one("load", showNotice);
    });
  }

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

      $userDetailClone.find(".user-data-wrap .inner .btn-icnOnly").hide();

      $userDataPopup.find(".user-detail-clone").remove();
      $userDataPopup.prepend($userDetailClone);
      openLayerPopup($userDataPopup);
    });

    $userDataPopup.children(".btn-icnOnly").on("click", function () {
      closeLayerPopup($userDataPopup);
      $userDataPopup.find(".user-detail-clone").remove();
    });
  });

  // 보상 링크: 활성 카드만 이동, 미정 주소는 이동 방지
  $(".reward .badge-list .btn").on("click", function (event) {
    if (!$(this).closest("li").hasClass("act") || $(this).attr("href") === "#") {
      event.preventDefault();
    }
  });

  // 좋아요버튼
  $(".btn-favorite").click(function () {
    $(this).toggleClass("act");
  });

  // 썸네일의 즐겨찾기 상태를 Book Info 화면에 전달
  $("a[href*='99bookInfo.html']").on("click", function () {
    const url = new URL(this.href);
    if ($(this).find(".content-thumb.fav").length) url.searchParams.set("favorite", "1");
    else url.searchParams.delete("favorite");
    this.href = url.href;
  });

  if ($(".bookinfo").length && new URLSearchParams(window.location.search).get("favorite") === "1") {
    $(".bookinfo .btn-favorite").addClass("act");
  }

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
  // 팝업오픈시 스크롤 작동 금지하기위한 변수
  let layerPopupScrollTop = 0;
  let isLayerPopupScrollLocked = false;

  if (window.location.pathname.split("/").pop() === "99popup+badge.html") {
    openLayerPopup($(".popup.badge-layer"));
  }

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
  function closeLayerPopup(popup) {
    const $popup = $(popup);

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

    finishCloseLayerPopup();
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
    colors: ["#39b629", "#a9d709", "#ffcc00", "#fc8923", "#ea485b", "#9d5ad6", "#4356a4", "#578ceb", "#a0dafb", "#7fe4de", "#C65AA9", "#7D3C98"],
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
