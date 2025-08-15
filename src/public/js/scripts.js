$('#btn-like').click(function (e) {
  e.preventDefault();
  const $btn  = $(this);
  const id    = $btn.data('id');
  const $cnt  = $btn.find('.likes-count');
  const $icon = $btn.find('i');
  const prev  = parseInt($cnt.text(), 10) || 0;

  $.post('/posts/' + id + '/like').done(function (data) {
    const next   = (data && (data.likes ?? data.likes_count)) ?? prev; // supports {likes} or {likes_count}
    const liked  = (data && data.liked); // may be undefined
    $cnt.text(next);

    // Decide the new state: prefer server boolean, else infer from count delta
    const nowOn = (liked === true) || (liked == null && next > prev);
    const nowOff = (liked === false) || (liked == null && next < prev);

    if (nowOn)  $icon.removeClass('fa-heart-o').addClass('fa-heart text-danger');
    if (nowOff) $icon.removeClass('fa-heart text-danger').addClass('fa-heart-o');

    // keep your existing partial refresh if you still use it elsewhere
    $('#likes').load(window.location.href + ' #likes');
  });
});

$('#btn-save').click(function (e) {
  e.preventDefault();
  const $btn  = $(this);
  const id    = $btn.data('id');
  const $cnt  = $btn.find('.saves-count');
  const $icon = $btn.find('i');
  const prev  = parseInt($cnt.text(), 10) || 0;

  $.post('/posts/' + id + '/save').done(function (data) {
    const next   = (data && (data.saved_by ?? data.saved_count)) ?? prev; // supports {saved_by} or {saved_count}
    const saved  = (data && data.saved); // may be undefined
    $cnt.text(next);

    const nowOn = (saved === true) || (saved == null && next > prev);
    const nowOff = (saved === false) || (saved == null && next < prev);

    if (nowOn)  $icon.removeClass('fa-flag-o').addClass('fa-flag text-warning');
    if (nowOff) $icon.removeClass('fa-flag text-warning').addClass('fa-flag-o');

    $('#saves').load(window.location.href + ' #saves');
  });
});
