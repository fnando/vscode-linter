# frozen_string_literal: true

puts 1

a = 1

puts {|invalid_syntax| b = 2}

eval 'puts 1'

class C; def m; end; end

def smelly_method foo
  foo.each {|bar| bar.each {|baz| baz.qux}}
end
