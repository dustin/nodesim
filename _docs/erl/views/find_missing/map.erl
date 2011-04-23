fun({Doc}) ->
        F = fun(B) -> proplists:get_value(B, Doc) end,
        FD = fun(B, D) -> proplists:get_value(B, Doc, D) end,
        case length(FD(<<"missing">>, [])) of
            0 ->
                %% Don't care
                ok;
            undefined ->
                %% Don't care
                ok;
            NMissing ->
                Failed0 = F(<<"failed">>),
                Failed = lists:map(fun ({X}) ->
                                           proplists:get_value(<<"id">>, X)
                                   end,
                                   Failed0),
                Emit([F(<<"test">>), F(<<"n_dead_nodes">>)],
                     {[
                       {<<"algorithm">>, F(<<"algorithm">>)},
                       {<<"missing">>, F(<<"missing">>)},
                       {<<"n_missing">>, NMissing},
                       {<<"down">>, F(<<"n_dead_nodes">>)},
                       {<<"up">>, F(<<"n_alive_nodes">>)},
                       {<<"failed">>, Failed}
                      ]})
        end
end.
