local function f(x)
   local x = x or "default" -- bad
end

local function f(x)
   x = x or "default" -- good
end
