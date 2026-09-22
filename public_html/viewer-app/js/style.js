$(document).ready(function () {
  // 목차와 사전 팝업 열기
  $(".bottom .con .playOption-wrap li.indexList > .btn").on("click", function () {
    $(".list-popup").addClass("act").closest(".dimmed").addClass("act");
  });

  $(".top .icn-dictionary").on("click", function () {
    $("#dic-layer").addClass("act").closest(".dimmed").addClass("act");
  });

  // 각 팝업의 닫기 버튼으로 팝업과 배경 닫기
  $(".popup .btn-closed").on("click", function () {
    $(this).closest(".popup").removeClass("act").closest(".dimmed").removeClass("act");
  });

  // 뷰어 크기에 맞춰 메뉴 위치와 페이지 영역 설정
  const $viewer = $("main").first();

  if ($viewer.length) {
    const viewer = $viewer[0];
    const $wrap = $viewer.closest(".wrap");
    const $top = $wrap.children("nav#top");
    const $bottom = $wrap.children("nav#bt");
    const $pages = $viewer.find(".inner .flex > .page");
    const $pageWrap = $pages.parent();
    const $rotateWrap = $pageWrap.parent(".rotate-wrap");
    const $prev = $viewer.children(".btn-prev");
    const $next = $viewer.children(".btn-next");
    const $pageRange = $bottom.find("li.range input[type='range']");
    const $pageRail = $pageRange.siblings(".rail");
    const $pagePercent = $pageRange.closest("li.range").children("span");
    const $zoomUp = $bottom.find("li.zoomUp");
    const $zoomDown = $bottom.find("li.zoomDown");
    const $rotate = $bottom.find("li.rotate");
    const totalPages = 10;
    const scales = [0.4, 0.6, 0.8, 1, 1.2, 1.4, 1.6];
    let zoomIndex = 3;
    let zoomButtonStep = 0;
    let rotationIndex = 0;
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
    let zoomFrame = null;

    // 초기 크기가 0이어도 CSS로 표시된 페이지를 확인
    const getVisiblePages = function () {
      return $pages.filter(function () {
        return $(this).css("display") !== "none";
      });
    };

    const updateControls = function () {
      const topHeight = $top.outerHeight();
      $top.css("top", controlsHidden ? -topHeight : 15);
      $bottom.css("bottom", controlsHidden ? -($bottom.outerHeight() + 15) : 15);
      $viewer.css("padding-top", controlsHidden ? 0 : topHeight);
      $viewer.css("padding-bottom", controlsHidden ? 0 : $bottom.outerHeight() + 15);
      $prev.css("left", controlsHidden ? -$prev.outerWidth() : 15);
      $next.css("right", controlsHidden ? -$next.outerWidth() : 15);
    };

    updateControls();
    $(window).on("load resize", updateControls);

    // 최초 로드 시 상하단 메뉴를 제외한 공간에 페이지만 맞춤
    const fitPages = function (centerZoom) {
      cancelAnimationFrame(zoomFrame);
      const $visiblePages = getVisiblePages();
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

        pageSizes.push({ page: $page, width: width });
        totalWidth += width;
        maxHeight = Math.max(maxHeight, height);
      });

      if (pageSizes.length !== $visiblePages.length || !totalWidth || !maxHeight) return;

      const gap = parseFloat($pageWrap.css("column-gap")) || parseFloat($pageWrap.css("gap")) || 0;
      const totalGap = gap * ($visiblePages.length - 1);
      const availableHeight = Math.max(1, viewer.clientHeight - $top.outerHeight() - $bottom.outerHeight() - 15);
      const scale = rotationIndex % 2
        ? Math.min(viewer.clientWidth / maxHeight, (availableHeight - totalGap) / totalWidth)
        : Math.min((viewer.clientWidth - totalGap) / totalWidth, availableHeight / maxHeight);
      const pageScale = scale * scales[zoomIndex];
      const wrapWidth = totalWidth * pageScale + totalGap;
      const wrapHeight = maxHeight * pageScale;

      pageSizes.forEach(function (pageSize) {
        pageSize.page.css("width", pageSize.width * pageScale + "px");
      });
      $pageWrap
        .removeClass("rotate90 rotate180 rotate270 rotate360")
        .addClass(rotationIndex ? "rotate" + rotationIndex * 90 : "")
        .css({ width: wrapWidth - 30 + "px", height: wrapHeight - 30 + "px" });
      $rotateWrap.css({
        width: (rotationIndex % 2 ? wrapHeight : wrapWidth) + "px",
        height: (rotationIndex % 2 ? wrapWidth : wrapHeight) + "px",
      });

      if (centerZoom === true) {
        // 크기 전환 중에도 회전 영역의 중앙을 뷰어 중앙에 유지
        const centerPages = function () {
          const viewerRect = viewer.getBoundingClientRect();
          const rotateRect = $rotateWrap[0].getBoundingClientRect();
          const paddingTop = parseFloat($viewer.css("padding-top")) || 0;
          const paddingBottom = parseFloat($viewer.css("padding-bottom")) || 0;
          viewer.scrollLeft += rotateRect.left + rotateRect.width / 2 - viewerRect.left - viewer.clientWidth / 2;
          viewer.scrollTop += rotateRect.top + rotateRect.height / 2 - viewerRect.top - (viewer.clientHeight + paddingTop - paddingBottom) / 2;
          if (Math.abs(rotateRect.width - (rotationIndex % 2 ? wrapHeight : wrapWidth)) > 0.5 ||
              Math.abs(rotateRect.height - (rotationIndex % 2 ? wrapWidth : wrapHeight)) > 0.5) {
            zoomFrame = requestAnimationFrame(centerPages);
          }
        };
        centerPages();
      } else {
        $viewer.scrollLeft(0).scrollTop(0);
      }
    };

    if (document.readyState === "complete") fitPages();
    else $(window).one("load", fitPages);

    // 확대·축소를 각 3단계로 제한하고 끝 단계의 버튼 비활성화
    $zoomUp.add($zoomDown).children(".btn").on("click", function () {
      const direction = $(this).parent().hasClass("zoomUp") ? 1 : -1;
      // 버튼 크기는 반대 방향 클릭 시 기존 단계를 되돌린 뒤 전환
      zoomButtonStep = Math.max(-3, Math.min(3, zoomButtonStep + direction));
      if (zoomButtonStep === 0) zoomButtonStep = direction;
      $zoomUp.removeClass("up1 up2 up3");
      $zoomDown.removeClass("down1 down2 down3");
      if (zoomButtonStep > 0) $zoomUp.addClass("up" + zoomButtonStep);
      else $zoomDown.addClass("down" + Math.abs(zoomButtonStep));
      zoomIndex = Math.max(0, Math.min(scales.length - 1, zoomIndex + direction));
      $zoomUp.toggleClass("disibled", zoomIndex === scales.length - 1);
      $zoomDown.toggleClass("disibled", zoomIndex === 0);
      fitPages(true);
    });

    // 클릭할 때마다 보이는 모든 페이지를 시계 방향으로 90도 회전
    $rotate.children(".btn").on("click", function () {
      if (rotationIndex === 4) return;
      rotationIndex += 1;
      fitPages();
    });

    // 360도 회전이 끝나면 전환 효과 없이 0도로 초기화
    $pageWrap.on("transitionend", function (event) {
      if (event.target !== this || event.originalEvent.propertyName !== "transform" || rotationIndex !== 4) return;
      rotationIndex = 0;
      $pageWrap.addClass("rotate-reset").removeClass("rotate360");
      void this.offsetWidth;
      $pageWrap.removeClass("rotate-reset");
    });

    // 보이는 페이지 수만큼 앞뒤 이미지를 교체
    const turnPages = function (direction, targetIndex) {
      const count = getVisiblePages().length;
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
      const count = getVisiblePages().length;
      $pageRange.attr({ min: 1, max: totalPages - count + 1, step: count });
    };

    updatePageRange();
    $prev.on("click", function () { turnPages(-1); });
    $next.on("click", function () { turnPages(1); });
    // 처음 버튼 클릭 시 첫 페이지와 진행률로 복귀
    $bottom.find("li.first > .btn").on("click", function () { turnPages(0, 0); });
    $pageRange.on("input", function () { turnPages(0, Number(this.value) - 1); });
    turnPages(0);

    $(window).on("resize", function () {
      const count = getVisiblePages().length;
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
  $(".top .icn-dictionary, .top .icn-bookMark").on("click", function () {
    $(this).children("img").toggleClass("act");
  });

  // 재생 버튼의 재생·일시정지 아이콘 전환
  $(".bottom .con .playOption-wrap li.play .btn").on("click", function () {
    $(this).children("img").toggleClass("act");
  });

  // 처음·재생·반복 버튼 클릭 애니메이션 재생
  $(".bottom .con .playOption-wrap li.first > .btn, .bottom .con .playOption-wrap li.play > .btn, .bottom .con .playOption-wrap li.repeat > .btn")
    .on("click", function () {
      const isFirst = this.parentElement.classList.contains("first");
      const animationTarget = isFirst ? this.parentElement : this;
      const animationClass = isFirst ? "btnFirst" : this.parentElement.classList.contains("repeat") ? "btnRotate" : "scaleUp";
      animationTarget.classList.remove(animationClass);
      void animationTarget.offsetWidth;
      animationTarget.classList.add(animationClass);
    })
    .add(".bottom .con .playOption-wrap li.first")
    .on("animationend", function (event) {
      const animationName = event.originalEvent.animationName;
      if (animationName === "scaleUp" || animationName === "btnRotate" || animationName === "btnFirst") this.classList.remove(animationName);
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
