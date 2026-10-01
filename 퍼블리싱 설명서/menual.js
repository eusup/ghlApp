$(document).ready(function () {
  $(".menual").on("click", ".btn-explanation-close", function () {
    $(this).closest(".explanation").remove();
  });
});
