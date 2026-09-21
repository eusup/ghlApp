$(document).ready(function () {
  // 뷰어 크기에 맞춰 메뉴 위치와 페이지 영역 설정
  const $viewer = $("main").first();

  if ($viewer.length) {
    const viewer = $viewer[0];
    const $wrap = $viewer.closest(".wrap");
    const $top = $wrap.children("nav#top");
    const $bottom = $wrap.children("nav#bt");
    const $pages = $viewer.find(".inner .flex > .page");
    const $prev = $viewer.children(".btn-prev");
    const $next = $viewer.children(".btn-next");
    const $pageRange = $bottom.find("li.range input[type='range']");
    const $pageRail = $pageRange.siblings(".rail");
    const $pagePercent = $pageRange.closest("li.range").children("span");
    const $zoomUp = $bottom.find("li.zoomUp");
    const $zoomDown = $bottom.find("li.zoomDown");
    const totalPages = 10;
    const scales = [0.4, 0.6, 0.8, 1, 1.2, 1.4, 1.6];
    let zoomIndex = 3;
    let pageIndex = 0;
    let startX = 0;
    let startY = 0;
    let startTime = 0;
    let scrollLeft = 0;
    let scrollTop = 0;
    let activePointerId = null;
    let isDragging = false;
    let pointerMoved = false;
    let multiTouch = false;
    let controlsHidden = false;

    const updateControls = function () {
      const topHeight = $top.outerHeight();
      $top.css("top", controlsHidden ? -topHeight : 0);
      $bottom.css("bottom", controlsHidden ? -($bottom.outerHeight() + 15) : 15);
      $viewer.css("padding-top", controlsHidden ? 0 : topHeight);
      $viewer.css("padding-bottom", controlsHidden ? 0 : $bottom.outerHeight() + 15);
      $prev.css("left", controlsHidden ? -$prev.outerWidth() : 15);
      $next.css("right", controlsHidden ? -$next.outerWidth() : 15);
    };

    updateControls();
    $(window).on("load resize", updateControls);

    // 최초 로드 시 상하단 메뉴를 제외한 공간에 페이지만 맞춤
    const fitPages = function () {
      const $visiblePages = $pages.filter(":visible");
      if (!$visiblePages.length || !viewer.clientWidth || !viewer.clientHeight) return;

      const pageSizes = [];
      let totalWidth = 0;
      let maxHeight = 0;

      $visiblePages.each(function () {
        const $page = $(this);
        const content = $page.children().first()[0];
        let width = 0;
        let height = 0;

        if (content) {
          if (content.naturalWidth && content.naturalHeight) {
            width = content.naturalWidth;
            height = content.naturalHeight;
          } else if (content.viewBox && content.viewBox.baseVal.width) {
            width = content.viewBox.baseVal.width;
            height = content.viewBox.baseVal.height;
          } else if (content.width && content.height) {
            width = content.width.baseVal ? content.width.baseVal.value : content.width;
            height = content.height.baseVal ? content.height.baseVal.value : content.height;
          }

          width = Number(width) || content.scrollWidth || content.offsetWidth;
          height = Number(height) || content.scrollHeight || content.offsetHeight;
        }

        width = Number(width) || $page.outerWidth();
        height = Number(height) || $page.outerHeight();

        if (!width || !height) return;

        pageSizes.push({ page: $page, width: width, height: height });
        totalWidth += width;
        maxHeight = Math.max(maxHeight, height);
      });

      if (pageSizes.length !== $visiblePages.length || !totalWidth || !maxHeight) return;

      const gap = parseFloat($pages.parent().css("column-gap")) || parseFloat($pages.parent().css("gap")) || 0;
      const scale = Math.min(
        (viewer.clientWidth - gap * ($visiblePages.length - 1)) / totalWidth,
        Math.max(1, viewer.clientHeight - $top.outerHeight() - $bottom.outerHeight() - 15) / maxHeight,
      );

      pageSizes.forEach(function (pageSize) {
        pageSize.page.css("width", pageSize.width * scale * scales[zoomIndex] + "px");
      });

      $viewer.scrollLeft(0).scrollTop(0);
    };

    if (document.readyState === "complete") fitPages();
    else $(window).one("load", fitPages);

    // 확대·축소를 각 3단계로 제한하고 끝 단계의 버튼 비활성화
    $zoomUp.add($zoomDown).children(".btn").on("click", function () {
      zoomIndex = Math.max(0, Math.min(scales.length - 1, zoomIndex + ($(this).parent().hasClass("zoomUp") ? 1 : -1)));
      $zoomUp.toggleClass("disibled", zoomIndex === scales.length - 1);
      $zoomDown.toggleClass("disibled", zoomIndex === 0);
      fitPages();
    });

    // 보이는 페이지 수만큼 앞뒤 이미지를 교체
    const turnPages = function (direction, targetIndex) {
      const count = $pages.filter(":visible").length;
      if (!count) return;
      pageIndex = Math.max(0, Math.min(targetIndex === undefined ? pageIndex + direction * count : targetIndex, totalPages - count));
      $pages.each(function (index) {
        if (pageIndex + index >= totalPages) return;
        const $image = $(this).children("img");
        const src = "./image/dump/" + String(pageIndex + index + 1).padStart(2, "0") + ".png";
        if ($image.attr("src") !== src) $image.attr("src", src);
      });
      $pageRange.val(pageIndex + 1);
      const percent = totalPages === count ? 100 : pageIndex / (totalPages - count) * 100;
      $pageRail.css("width", percent + "%");
      $pagePercent.text(Math.round(percent) + "%");
      $viewer.scrollLeft(0).scrollTop(0);
    };

    // 보이는 페이지 수에 따라 슬라이더 범위와 단위 조정
    const updatePageRange = function () {
      const count = $pages.filter(":visible").length;
      $pageRange.attr({ min: 1, max: totalPages - count + 1, step: count });
    };

    updatePageRange();
    $prev.on("click", function () { turnPages(-1); });
    $next.on("click", function () { turnPages(1); });
    $pageRange.on("input", function () { turnPages(0, Number(this.value) - 1); });
    turnPages(0);

    $(window).on("resize", function () {
      const count = $pages.filter(":visible").length;
      pageIndex = Math.floor(pageIndex / count) * count;
      updatePageRange();
      turnPages(0);
      fitPages();
    });

    // 3px 미만의 탭만 메뉴를 전환하고 넘친 콘텐츠는 드래그
    $viewer.on("pointerdown", function (event) {
      const pointerEvent = event.originalEvent;

      if (pointerEvent.button !== 0 || $(event.target).closest(".btn-prev, .btn-next").length) return;
      if (!pointerEvent.isPrimary) {
        multiTouch = true;
        pointerMoved = true;
        return;
      }

      activePointerId = pointerEvent.pointerId;
      startX = pointerEvent.clientX;
      startY = pointerEvent.clientY;
      startTime = Date.now();
      scrollLeft = viewer.scrollLeft;
      scrollTop = viewer.scrollTop;
      pointerMoved = false;
      multiTouch = false;
    });

    $viewer.on("pointermove", function (event) {
      const pointerEvent = event.originalEvent;

      if (activePointerId !== pointerEvent.pointerId) return;
      if (Math.abs(pointerEvent.clientX - startX) >= 3 || Math.abs(pointerEvent.clientY - startY) >= 3) {
        pointerMoved = true;
      }
      if (viewer.scrollWidth <= viewer.clientWidth && viewer.scrollHeight <= viewer.clientHeight) {
        if (pointerMoved && !viewer.hasPointerCapture(activePointerId)) viewer.setPointerCapture(activePointerId);
        return;
      }

      if (!isDragging) {
        if (!pointerMoved) return;

        isDragging = true;
        $viewer.addClass("dragging");
        viewer.setPointerCapture(activePointerId);
      }

      viewer.scrollLeft = scrollLeft - (pointerEvent.clientX - startX);
      viewer.scrollTop = scrollTop - (pointerEvent.clientY - startY);
    });

    $viewer.on("pointerup pointercancel", function (event) {
      const pointerEvent = event.originalEvent;
      if (activePointerId !== pointerEvent.pointerId) return;

      // 확대 중에는 드래그만 허용하고 1배 이하의 빠른 가로 스와이프만 페이지 이동
      if (event.type === "pointerup" && zoomIndex <= 3 && !multiTouch && Math.abs(pointerEvent.clientX - startX) >= 60 &&
          Math.abs(pointerEvent.clientX - startX) > Math.abs(pointerEvent.clientY - startY) * 1.2 &&
          Math.abs(pointerEvent.clientX - startX) / Math.max(1, Date.now() - startTime) >= 0.5) {
        turnPages(pointerEvent.clientX < startX ? 1 : -1);
      }

      if (event.type === "pointerup" && !pointerMoved && !isDragging &&
          Math.abs(pointerEvent.clientX - startX) < 3 && Math.abs(pointerEvent.clientY - startY) < 3) {
        controlsHidden = !controlsHidden;
        updateControls();
      }

      if (viewer.hasPointerCapture(activePointerId)) viewer.releasePointerCapture(activePointerId);
      $viewer.removeClass("dragging");
      activePointerId = null;
      isDragging = false;
    });

    // 이미지 자체의 브라우저 드래그 방지
    $viewer.on("dragstart", function (event) {
      event.preventDefault();
    });
  }

  // 사전·북마크 버튼의 아이콘 상태 전환
  $(".top .icn-dictinary, .top .icn-bookMark").on("click", function () {
    $(this).children("img").toggleClass("act");
  });

  // 재생 버튼의 재생·일시정지 아이콘 전환
  $(".bottom .con .playOption-wrap li.play .btn").on("click", function () {
    $(this).children("img").toggleClass("act");
  });

  // 재생·반복 버튼 클릭 애니메이션 재생
  $(".bottom .con .playOption-wrap li.play > .btn, .bottom .con .playOption-wrap li.repeat > .btn")
    .on("click", function () {
      const animationClass = this.parentElement.classList.contains("repeat") ? "btnRotate" : "scaleUp";
      this.classList.remove(animationClass);
      void this.offsetWidth;
      this.classList.add(animationClass);
    })
    .on("animationend", function (event) {
      const animationName = event.originalEvent.animationName;
      if (animationName === "scaleUp" || animationName === "btnRotate") this.classList.remove(animationName);
    });

  // 자동 재생 버튼 선택 상태 전환
  $(".bottom .con .playOption-wrap li.autoPlay .btn").on("click", function () {
    $(this).parent("li.autoPlay").toggleClass("act");
  });

  // 드래그 중 페이지 슬라이더 값 갱신
  $(".bottom .con .playOption-wrap li.range").each(function () {
    const $track = $(this).children(".flex");
    const $input = $track.children("input[type='range']");
    let activePointerId = null;

    const updateRangeByPointer = function (pointerEvent) {
      const trackRect = $track[0].getBoundingClientRect();
      const min = Number($input.attr("min")) || 0;
      const max = Number($input.attr("max")) || 100;
      const step = Number($input.attr("step")) || 1;
      $input.val(min + Math.round(
        (Math.max(0, Math.min(1, (pointerEvent.clientX - trackRect.left) / trackRect.width)) * (max - min)) / step,
      ) * step).trigger("input");
    };

    $track.on("pointerdown", function (event) {
      const pointerEvent = event.originalEvent;

      if (pointerEvent.button !== 0) return;

      activePointerId = pointerEvent.pointerId;
      this.setPointerCapture(activePointerId);
      updateRangeByPointer(pointerEvent);
    });

    $track.on("pointermove", function (event) {
      const pointerEvent = event.originalEvent;

      if (activePointerId !== pointerEvent.pointerId) return;
      updateRangeByPointer(pointerEvent);
    });

    $track.on("pointerup pointercancel", function (event) {
      const pointerEvent = event.originalEvent;

      if (activePointerId !== pointerEvent.pointerId) return;
      if (this.hasPointerCapture(activePointerId)) this.releasePointerCapture(activePointerId);
      activePointerId = null;
    });
  });

  // 재생 속도 메뉴 열기와 선택값 표시
  $(".bottom .con .playOption-wrap li.speed").each(function () {
    const $speed = $(this);
    const $speedButton = $speed.children(".btn");
    const $speedList = $speed.children("ul");
    const $speedOptions = $speedList.children("li").children(".btn");
    $speedOptions.each(function () {
      $(this).toggleClass("act", parseFloat($(this).text().replace("x", "")) === parseFloat($speedButton.children("span").text().replace("x", "")));
    });

    $speedButton.on("click", function () {
      $speedList.toggleClass("act");
    });

    $speedOptions.on("click", function () {
      $(this).addClass("act").parent("li").siblings("li").children(".btn").removeClass("act");
      $speedButton.children("span").text($(this).text());
      $speedList.removeClass("act");
    });
  });
});
