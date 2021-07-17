defmodule SamplesTest do
  use ExUnit.Case
  doctest Samples

  test "greets the world" do
    assert Samples.hello() == :world
  end
end
