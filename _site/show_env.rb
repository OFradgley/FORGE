puts "=== ENV dump ==="
ENV.sort.each { |k, v| puts "#{k.inspect} = #{v.inspect}" if k =~ /BUNDLER|RUBY/i }