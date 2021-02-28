$('#btn-like').click(function(e){
    e.preventDefault();
    let postId = $(this).data('id');
    $.post('/posts/' + postId + "/like")
        .done(data => {
            $('.likes-count').text(data.likes);
            $( "#likes" ).load(window.location.href + " #likes" );
            //location.reload({cache: true});
            //$('#d-flex').load('post');
        })
});

function toggleImage(){
    document.querySelector('#content').classList.toggle('hidden');
  }
/* $('#btn-delete').click(function(e){
    e.preventDefault();
    let $this = $(this);
    const response = confirm('Are you sure you want to delete this image?');
    if(response){
        let postId = $this.data('id');
        $.ajax({
            url: '/posts/' + postId,
            type: 'DELETE'
        })
        .done(function(result){
            $this.removeClass('btn-danger').addClass('btn-success');
            $this.find('i').removeClass('fa-trash').addClass('fa-check-square-o');
            $this.append('<span>Deleted!</span>');
        })
    }
}) */