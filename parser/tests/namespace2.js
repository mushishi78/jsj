var Foo = Foo || {};
var Foo.Bar = Foo.Bar || {};
var Foo.Bar.Quiz = Foo.Bar.Quiz || {};
(function() {
    var Duck = 0;
    var Cow = 1;
    var Chicken = 2;
    Foo.Bar.Quiz.Duck = Duck;
    Foo.Bar.Quiz.Cow = Cow;
    Foo.Bar.Quiz.Chicken = Chicken;
})();