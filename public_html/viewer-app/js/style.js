$(document).ready(function () {
  // 뷰어 콘텐츠가 화면을 벗어난 경우 드래그로 이동
  const $viewer = $("main").first();

  if ($viewer.length) {
    const viewer = $viewer[0];
    const $pages = $viewer.find(".inner .flex > .page");
    let startX = 0;
    let startY = 0;
    let scrollLeft = 0;
    let scrollTop = 0;
    let activePointerId = null;
    let isDragging = false;

    // 첫 화면에서 모든 page가 뷰어 영역 안에 들어오도록 크기 조절
    const fitPages = function () {
      if (!$pages.length || !viewer.clientWidth || !viewer.clientHeight) return;

      const pageSizes = [];
      let totalWidth = 0;
      let maxHeight = 0;

      $pages.each(function () {
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

      if (pageSizes.length !== $pages.length || !totalWidth || !maxHeight) return;

      const $pageWrap = $pages.parent();
      const gap = parseFloat($pageWrap.css("column-gap")) || parseFloat($pageWrap.css("gap")) || 0;
      const totalGap = gap * Math.max(0, pageSizes.length - 1);
      const scale = Math.min((viewer.clientWidth - totalGap) / totalWidth, viewer.clientHeight / maxHeight);

      $.each(pageSizes, function (index, pageSize) {
        pageSize.page.css("width", pageSize.width * scale + "px");
      });

      $viewer.scrollLeft(0).scrollTop(0);
    };

    if (document.readyState === "complete") fitPages();
    else $(window).one("load", fitPages);

    const canDrag = function () {
      return viewer.scrollWidth > viewer.clientWidth || viewer.scrollHeight > viewer.clientHeight;
    };

    const stopDragging = function (event) {
      const pointerEvent = event.originalEvent;

      if (activePointerId !== pointerEvent.pointerId) return;

      $viewer.removeClass("dragging");

      if (viewer.hasPointerCapture(activePointerId)) {
        viewer.releasePointerCapture(activePointerId);
      }

      activePointerId = null;
      isDragging = false;
    };

    $viewer.on("pointerdown", function (event) {
      const pointerEvent = event.originalEvent;

      if (pointerEvent.button !== 0 || !canDrag()) return;

      activePointerId = pointerEvent.pointerId;
      startX = pointerEvent.clientX;
      startY = pointerEvent.clientY;
      scrollLeft = viewer.scrollLeft;
      scrollTop = viewer.scrollTop;
    });

    $viewer.on("pointermove", function (event) {
      const pointerEvent = event.originalEvent;

      if (activePointerId !== pointerEvent.pointerId) return;

      if (!isDragging) {
        if (Math.abs(pointerEvent.clientX - startX) < 3 && Math.abs(pointerEvent.clientY - startY) < 3) return;

        isDragging = true;
        $viewer.addClass("dragging");
        viewer.setPointerCapture(activePointerId);
      }

      viewer.scrollLeft = scrollLeft - (pointerEvent.clientX - startX);
      viewer.scrollTop = scrollTop - (pointerEvent.clientY - startY);
    });

    $viewer.on("pointerup pointercancel", stopDragging);
    $viewer.on("dragstart", function (event) {
      event.preventDefault();
    });
  }

  // 사전·북마크 아이콘 전환
  $(".top .icn-dictinary, .top .icn-bookMark").on("click", function () {
    $(this).children("img").toggleClass("act");
  });

  // 재생·일시정지 아이콘 전환
  $(".bottom .con .playOption-wrap li.play .btn").on("click", function () {
    $(this).children("img").toggleClass("act");
  });

  // 자동 재생 활성화·비활성화
  $(".bottom .con .playOption-wrap li.autoPlay .btn").on("click", function () {
    $(this).parent("li.autoPlay").toggleClass("act");
  });

  // 재생 위치 범위 조절
  $(".bottom .con .playOption-wrap li.range").each(function () {
    const $range = $(this);
    const $track = $range.children(".flex");
    const $input = $track.children("input[type='range']");
    const $rail = $track.children(".rail");
    const $value = $range.children("span");
    let activePointerId = null;

    const updateRange = function (value) {
      const min = Number($input.attr("min")) || 0;
      const max = Number($input.attr("max")) || 100;
      const rangeValue = Math.max(min, Math.min(max, Number(value)));
      const percent = max === min ? 0 : ((rangeValue - min) / (max - min)) * 100;

      $input.val(rangeValue);
      $rail.css("width", percent + "%");
      $value.text(Math.round(percent) + "%");
      console.log("range input value:", $input.val());
    };

    const updateRangeByPointer = function (pointerEvent) {
      const trackRect = $track[0].getBoundingClientRect();
      const min = Number($input.attr("min")) || 0;
      const max = Number($input.attr("max")) || 100;
      const step = Number($input.attr("step")) || 1;
      const ratio = Math.max(0, Math.min(1, (pointerEvent.clientX - trackRect.left) / trackRect.width));
      const value = min + Math.round((ratio * (max - min)) / step) * step;

      $input.val(value).trigger("input");
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

    $input.on("input change", function () {
      updateRange($(this).val());
    });

    const railObserver = new MutationObserver(function () {
      const min = Number($input.attr("min")) || 0;
      const max = Number($input.attr("max")) || 100;
      const step = Number($input.attr("step")) || 1;
      const ratio = Math.max(0, Math.min(1, $rail.outerWidth() / $track.innerWidth()));
      const value = min + Math.round((ratio * (max - min)) / step) * step;

      if (Number($input.val()) === value) return;

      $input.val(value).trigger("input");
    });

    railObserver.observe($rail[0], {
      attributes: true,
      attributeFilter: ["class", "style"],
    });

    updateRange($input.val());
  });

  // 재생 속도 선택
  $(".bottom .con .playOption-wrap li.speed").each(function () {
    const $speed = $(this);
    const $speedButton = $speed.children(".btn");
    const $speedList = $speed.children("ul");
    const $speedOptions = $speedList.children("li").children(".btn");
    const currentSpeed = parseFloat($speedButton.children("span").text().replace("x", ""));

    $speedOptions.each(function () {
      $(this).toggleClass("act", parseFloat($(this).text().replace("x", "")) === currentSpeed);
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
