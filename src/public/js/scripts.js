$('#btn-like').click(function(e){
    e.preventDefault();
    let postId = $(this).data('id');
    $.post('/posts/' + postId + "/like")
        .done(data => {
            $('.likes-count').text(data.likes);
            $( "#likes" ).load(window.location.href + " #likes" );
        })
});

